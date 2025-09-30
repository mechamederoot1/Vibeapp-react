from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from fastapi.responses import JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional
import jwt
from pydantic import BaseModel, EmailStr
from ..database.database import get_db
from ..models.user import User
from ..models.session import UserSession
import os
import uuid

router = APIRouter()

# JWT Settings
SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError("SECRET_KEY environment variable must be set")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30 * 24 * 60  # 30 days

class UserRegister(BaseModel):
    firstName: str
    lastName: str
    email: EmailStr
    password: str
    gender: Optional[str] = None
    birthDate: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

from typing import Optional as _Optional

class Token(BaseModel):
    access_token: _Optional[str] = None
    token_type: _Optional[str] = None
    user: dict

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id_str = payload.get("sub")
        jti = payload.get("jti")
        if user_id_str is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        user_id = int(user_id_str)
        return {"user_id": user_id, "jti": jti}
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

security = HTTPBearer()

def get_current_user(request: Request, db: Session = Depends(get_db)):
    # Support Authorization header or HttpOnly cookie
    token = None
    auth_header = request.headers.get('authorization')
    if auth_header and auth_header.lower().startswith('bearer '):
        token = auth_header.split(' ', 1)[1]
    else:
        token = request.cookies.get('access_token')

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )

    verified = verify_token(token)
    user_id = verified.get('user_id')
    jti = verified.get('jti')

    # Check session record exists and is active
    session = None
    try:
        session = db.query(UserSession).filter(UserSession.jti == jti, UserSession.user_id == user_id, UserSession.is_active == True).first()
    except Exception:
        session = None

    if not session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session not found or revoked"
        )

    # Optionally update last_used_at
    try:
        session.last_used_at = datetime.utcnow()
        db.commit()
    except Exception:
        db.rollback()

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    return user

@router.post("/register", response_model=Token)
async def register(user_data: UserRegister, request: Request, response: Response, db: Session = Depends(get_db)):
    try:
        print(f"🚀 Endpoint de registro chamado com dados: {user_data}")

        # Check if user already exists
        existing_user = db.query(User).filter(User.email == user_data.email).first()
        if existing_user:
            print(f"❌ Email já existe: {user_data.email}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )

        # Create new user
        birth_date = None
        if user_data.birthDate:
            try:
                birth_date = datetime.strptime(user_data.birthDate, "%Y-%m-%d").date()
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid birth date format. Use YYYY-MM-DD"
                )

        new_user = User(
            email=user_data.email,
            first_name=user_data.firstName,
            last_name=user_data.lastName,
            gender=user_data.gender,
            birth_date=birth_date
        )
        new_user.set_password(user_data.password)

        # Generate username from name if not provided
        base_username = f"{user_data.firstName.lower()}.{user_data.lastName.lower()}"
        username = base_username
        counter = 1
        while db.query(User).filter(User.username == username).first():
            username = f"{base_username}{counter}"
            counter += 1
        new_user.username = username
        print(f"📝 Usuário criado com username: {username}")

        # Generate unique public profile id (10-digit numeric) with commit-retry to avoid scans
        import secrets
        import string
        from sqlalchemy.exc import IntegrityError

        def generate_numeric_id(n=10):
            alphabet = string.digits
            return ''.join(secrets.choice(alphabet) for _ in range(n))

        max_attempts = 10
        for attempt in range(max_attempts):
            new_user.public_profile_id = generate_numeric_id(10)
            try:
                db.add(new_user)
                db.commit()
                db.refresh(new_user)
                print(f"✅ Usuário salvo no banco com ID: {new_user.id} e publicProfileId: {new_user.public_profile_id}")
                break
            except IntegrityError as e:
                db.rollback()
                # Retry only for public_profile_id collisions
                if 'public_profile_id' in str(e).lower():
                    if attempt == max_attempts - 1:
                        raise HTTPException(
                            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail="Could not generate unique public profile id"
                        )
                    continue
                # Other integrity errors should bubble up
                raise

        # Create access token + persist session
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        jti = str(uuid.uuid4())
        token_payload = {"sub": str(new_user.id), "jti": jti}
        access_token = create_access_token(data=token_payload, expires_delta=access_token_expires)

        # Persist session
        try:
            ua = request.headers.get('user-agent') if request else None
            ip = request.client.host if request and request.client else None
            sess = UserSession(user_id=new_user.id, jti=jti, user_agent=ua, ip_address=ip, is_active=True)
            db.add(sess)
            db.commit()
            db.refresh(sess)
        except Exception:
            db.rollback()

        print(f"🔑 Token criado para usuário {new_user.id}")

        # Set token as HttpOnly cookie
        try:
            is_secure = True if str(request.url.scheme).lower() == 'https' else False
        except Exception:
            is_secure = False
        response.set_cookie(
            key="access_token",
            value=access_token,
            httponly=True,
            secure=is_secure,
            samesite="lax",
            max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            path='/'
        )
        response_data = {"user": new_user.to_dict()}
        print(f"📤 Retornando resposta de sucesso para usuário {new_user.email}")
        return response_data

    except HTTPException:
        # Re-raise HTTP exceptions as they are
        raise
    except Exception as e:
        # Log the error and return a generic 500 error
        print(f"❌ Registration error: {str(e)}")
        print(f"❌ Error type: {type(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error during registration: {str(e)}"
        )

@router.post("/login", response_model=Token)
async def login(user_data: UserLogin, request: Request, db: Session = Depends(get_db)):
    # Find user by email
    user = db.query(User).filter(User.email == user_data.email).first()
    if not user or not user.verify_password(user_data.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Inactive user"
        )

    # Update last login
    user.last_login = datetime.utcnow()
    db.commit()

    # Create access token + session record
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    jti = str(uuid.uuid4())
    token_payload = {"sub": str(user.id), "jti": jti}
    access_token = create_access_token(data=token_payload, expires_delta=access_token_expires)

    try:
        ua = request.headers.get('user-agent') if request else None
        ip = request.client.host if request and request.client else None
        sess = UserSession(user_id=user.id, jti=jti, user_agent=ua, ip_address=ip, is_active=True)
        db.add(sess)
        db.commit()
        db.refresh(sess)
    except Exception:
        db.rollback()

    # Set token as HttpOnly cookie
    try:
        is_secure = True if str(request.url.scheme).lower() == 'https' else False
    except Exception:
        is_secure = False
    # We need Response object to set cookie; use FastAPI Response by raising through context? Instead, construct Response and set cookie
    response = JSONResponse(content={"user": user.to_dict()})
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=is_secure,
        samesite="lax",
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path='/'
    )
    return response

@router.get("/me")
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    return current_user.to_dict()

@router.post("/logout")
async def logout(request: Request, db: Session = Depends(get_db)):
    # Read token from Authorization header or cookie
    token = None
    auth_header = request.headers.get('authorization')
    if auth_header and auth_header.lower().startswith('bearer '):
        token = auth_header.split(' ', 1)[1]
    else:
        token = request.cookies.get('access_token')

    try:
        verified = verify_token(token) if token else {}
        jti = verified.get('jti')
        user_id = verified.get('user_id')
    except Exception:
        jti = None
        user_id = None

    if jti and user_id:
        try:
            sess = db.query(UserSession).filter(UserSession.jti == jti, UserSession.user_id == user_id).first()
            if sess:
                sess.is_active = False
                db.commit()
        except Exception:
            db.rollback()

    # Clear cookie in response
    resp = JSONResponse(content={"message": "Successfully logged out"})
    resp.delete_cookie('access_token')
    return resp


# Health check endpoint
@router.get("/health")
async def auth_health():
    return {"status": "healthy", "service": "authentication"}


async def get_user_from_websocket(token: str, db: Session = None):
    """Função para autenticar usuário via WebSocket"""
    if not db:
        # Se não passou db, precisa obter uma sessão
        from ..database.database import SessionLocal
        db = SessionLocal()
        should_close = True
    else:
        should_close = False

    try:
        verified = verify_token(token)
        user_id = verified.get('user_id')
        jti = verified.get('jti')
        # Ensure session is active
        if not user_id:
            return None
        sess = db.query(UserSession).filter(UserSession.jti == jti, UserSession.user_id == user_id, UserSession.is_active == True).first()
        if not sess:
            return None
        user = db.query(User).filter(User.id == user_id).first()
        return user
    except Exception:
        return None
    finally:
        if should_close:
            db.close()
