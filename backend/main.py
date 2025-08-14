from fastapi import FastAPI, HTTPException, Request, WebSocket, Query
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from datetime import datetime
import uvicorn
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import database
from app.database.database import engine, Base

# Import API routers
from app.api.auth import router as auth_router
from app.api.users import router as users_router
from app.api.posts import router as posts_router
from app.api.stories import router as stories_router
from app.api.reactions import router as reactions_router
from app.api.uploads import router as uploads_router
from app.api.account_settings import router as account_settings_router
from app.api.messages import router as messages_router
from app.api.shares import router as shares_router
from app.api.notifications import router as notifications_router

# Import WebSocket
from app.websocket import websocket_endpoint

# Import models to ensure they're registered
from app.models.user import User
from app.models.post import Post, PostLike, Comment, Share
from app.models.reaction import PostReaction, CommentReaction
from app.models.story import Story, StoryView
from app.models.friendship import Friendship
from app.models.profile_view import ProfileView
from app.models.notification import Notification
from app.models.account_settings import AccountSettings
from app.models.message import Message, Conversation, PostShare

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create database tables
    try:
        Base.metadata.create_all(bind=engine)
        print("✅ Database tables created successfully")
    except Exception as e:
        print(f"❌ Error creating database tables: {e}")
    yield
    print("👋 Application shutdown")

# Create FastAPI app
app = FastAPI(
    title="Vibe Social API",
    description="API for Vibe Social - A modern social media platform",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://192.168.1.109:3000",
        "http://192.168.1.39:3000",  # Added the IP from logs
        "http://127.0.0.1:3000",
        "https://4f74aff8a7324cf3a973db464b7838f3-92473844a32c474a83927ab1b.fly.dev",
        "*"
    ],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Debug middleware
@app.middleware("http")
async def debug_requests(request: Request, call_next):
    if "/api/stories" in str(request.url) and request.method == "POST":
        print(f"🔍 DEBUG: {request.method} {request.url}")
        print(f"🔍 Headers: {dict(request.headers)}")
        # Check for Authorization header
        auth_header = request.headers.get("authorization")
        if auth_header:
            print(f"🔑 Auth header found: {auth_header[:50]}...")
        else:
            print("❌ NO AUTH HEADER FOUND!")

    response = await call_next(request)

    if "/api/stories" in str(request.url) and request.method == "POST":
        print(f"📤 Response status: {response.status_code}")

    return response

# Include routers
app.include_router(auth_router, prefix="/api/auth", tags=["authentication"])
app.include_router(users_router, prefix="/api/users", tags=["users"])
app.include_router(posts_router, prefix="/api/posts", tags=["posts"])
app.include_router(stories_router, prefix="/api/stories", tags=["stories"])
app.include_router(reactions_router, prefix="/api/reactions", tags=["reactions"])
app.include_router(uploads_router, prefix="/api/uploads", tags=["uploads"])
app.include_router(account_settings_router, prefix="/api/settings", tags=["account_settings"])
app.include_router(messages_router, prefix="/api/messages", tags=["messages"])
app.include_router(shares_router, prefix="/api/shares", tags=["shares"])
app.include_router(notifications_router, prefix="/api/notifications", tags=["notifications"])

# WebSocket endpoint
@app.websocket("/ws")
async def websocket_handler(websocket: WebSocket, token: str = Query(None)):
    await websocket_endpoint(websocket, token)

# Mount static files (uploads)
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

@app.get("/")
async def root():
    return {
        "message": "Welcome to Vibe Social API",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "message": "Vibe Social API is running",
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/health")
async def health_check_simple():
    return {"status": "ok"}

# Error handlers
@app.exception_handler(404)
async def not_found_handler(request, exc):
    return HTTPException(status_code=404, detail="Endpoint not found")

@app.exception_handler(500)
async def internal_error_handler(request, exc):
    return HTTPException(status_code=500, detail="Internal server error")

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
