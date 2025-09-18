from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional
import jwt
from pydantic import BaseModel, EmailStr
from ..database.database import get_db
from ..models.user import User
import os

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

class Token(BaseModel):
    access_token: str
    token_type: str
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
        if user_id_str is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        user_id = int(user_id_str)
        return user_id
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    token = credentials.credentials
    user_id = verify_token(token)
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    return user

@router.post("/register", response_model=Token)
async def register(user_data: UserRegister, db: Session = Depends(get_db)):
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

        # Generate unique public profile id (12-digit numeric, database-unique)
        import secrets
        import string
        def generate_numeric_id(n=12):
            alphabet = string.digits
            return ''.join(secrets.choice(alphabet) for _ in range(n))
        public_id = generate_numeric_id()
        attempts = 0
        while db.query(User).filter(User.public_profile_id == public_id).first():
            public_id = generate_numeric_id()
            attempts += 1
            if attempts > 5:
                # on rare collisions, increase length
                public_id = generate_numeric_id(16)
        new_user.public_profile_id = public_id

        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        print(f"✅ Usuário salvo no banco com ID: {new_user.id} e publicProfileId: {new_user.public_profile_id}")

        # Create access token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": str(new_user.id)}, expires_delta=access_token_expires
        )
        print(f"🔑 Token criado para usuário {new_user.id}")

        response_data = {
            "access_token": access_token,
            "token_type": "bearer",
            "user": new_user.to_dict()
        }
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
async def login(user_data: UserLogin, db: Session = Depends(get_db)):
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
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user.to_dict()
    }

@router.get("/me")
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    return current_user.to_dict()

@router.post("/logout")
async def logout():
    # In a real app, you might want to blacklist the token
    return {"message": "Successfully logged out"}


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
        user_id = verify_token(token)
        user = db.query(User).filter(User.id == user_id).first()
        return user
    except Exception:
        return None
    finally:
        if should_close:
            db.close()
