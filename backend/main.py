from fastapi import FastAPI, HTTPException, Request, WebSocket, Query
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
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
from app.api.friendships import router as friendships_router
from app.api.personal_info import router as personal_info_router
from app.api.highlights import router as highlights_router
from app.api.work_experience import router as work_experience_router
from app.api.education import router as education_router
from app.api.media import router as media_router

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
from app.models.personal_info import PersonalInfo
from app.models.highlight import Highlight, HighlightStory
from app.models.work_experience import WorkExperience
from app.models.education import Education

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create database tables
    try:
        Base.metadata.create_all(bind=engine)
        print("✅ Database tables created successfully")
        # Ensure optional blob and mime columns exist (SQLite)
        try:
            from sqlalchemy import text
            with engine.begin() as conn:
                def has_col(table, col):
                    res = conn.execute(text(f"PRAGMA table_info({table})"))
                    return any(row[1] == col for row in res.fetchall())
                # users
                if not has_col('users', 'avatar_blob'):
                    conn.execute(text("ALTER TABLE users ADD COLUMN avatar_blob BLOB"))
                if not has_col('users', 'avatar_mime'):
                    conn.execute(text("ALTER TABLE users ADD COLUMN avatar_mime TEXT"))
                if not has_col('users', 'cover_blob'):
                    conn.execute(text("ALTER TABLE users ADD COLUMN cover_blob BLOB"))
                if not has_col('users', 'cover_mime'):
                    conn.execute(text("ALTER TABLE users ADD COLUMN cover_mime TEXT"))
                # posts
                if not has_col('posts', 'image_blob'):
                    conn.execute(text("ALTER TABLE posts ADD COLUMN image_blob BLOB"))
                if not has_col('posts', 'image_mime'):
                    conn.execute(text("ALTER TABLE posts ADD COLUMN image_mime TEXT"))
                if not has_col('posts', 'video_blob'):
                    conn.execute(text("ALTER TABLE posts ADD COLUMN video_blob BLOB"))
                if not has_col('posts', 'video_mime'):
                    conn.execute(text("ALTER TABLE posts ADD COLUMN video_mime TEXT"))
                # stories
                if not has_col('stories', 'media_blob'):
                    conn.execute(text("ALTER TABLE stories ADD COLUMN media_blob BLOB"))
                if not has_col('stories', 'media_mime'):
                    conn.execute(text("ALTER TABLE stories ADD COLUMN media_mime TEXT"))
                # messages
                if not has_col('messages', 'media_blob'):
                    conn.execute(text("ALTER TABLE messages ADD COLUMN media_blob BLOB"))
                if not has_col('messages', 'media_mime'):
                    conn.execute(text("ALTER TABLE messages ADD COLUMN media_mime TEXT"))
            print("✅ Verified/added optional blob columns")
        except Exception as me:
            print(f"⚠️ Could not verify/add blob columns: {me}")
        # Run lightweight migrations
        try:
            import sys, os
            scripts_dir = os.path.join(os.path.dirname(__file__), 'scripts')
            if scripts_dir not in sys.path:
                sys.path.insert(0, scripts_dir)
        except Exception as me:
            print(f"⚠️ Could not prepare scripts path: {me}")
        try:
            from scripts.migrate_public_profile_id import migrate as migrate_public_id
            migrate_public_id()
            print("✅ Migration public_profile_id applied")
        except Exception as me:
            print(f"⚠️ Migration public_profile_id failed or skipped: {me}")
        try:
            from scripts.migrate_post_public_id import migrate as migrate_post_public_id
            migrate_post_public_id()
            print("✅ Migration post_public_id applied")
        except Exception as me:
            print(f"⚠️ Migration post_public_id failed or skipped: {me}")
        try:
            from scripts.migrate_work_education import migrate_work_education
            if migrate_work_education():
                print("✅ Migration work_education applied")
            else:
                print("⚠️ Migration work_education returned False (possibly already migrated)")
        except Exception as me:
            print(f"⚠️ Migration work_education failed or skipped: {me}")
        try:
            from scripts.migrate_profile_photos import migrate as migrate_profile_photos
            if migrate_profile_photos():
                print("✅ Migration profile_photos applied")
            else:
                print("⚠️ Migration profile_photos returned False (possibly already migrated)")
        except Exception as me:
            print(f"⚠️ Migration profile_photos failed or skipped: {me}")
        try:
            from scripts.migrate_add_indexes import migrate as migrate_add_indexes
            if migrate_add_indexes():
                print("✅ Migration add_indexes applied")
            else:
                print("⚠️ Migration add_indexes returned False (possibly already migrated)")
        except Exception as me:
            print(f"⚠️ Migration add_indexes failed or skipped: {me}")
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

# Configure CORS - allow all local network IPs for development
def get_cors_origins():
    origins = [
        "http://localhost:3000",
        "http://localhost:4001",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:4001",
        "http://127.0.0.1:5173",
        "https://4f74aff8a7324cf3a973db464b7838f3-92473844a32c474a83927ab1b.fly.dev"
    ]

    # Add common local network ranges for mobile development
    # This allows access from mobile devices on the same network
    for i in range(1, 255):
        origins.extend([
            f"http://192.168.1.{i}:3000",
            f"http://192.168.1.{i}:4001",
            f"http://192.168.1.{i}:5173",
            f"http://192.168.0.{i}:3000",
            f"http://192.168.0.{i}:4001",
            f"http://192.168.0.{i}:5173",
            f"http://10.0.0.{i}:3000",
            f"http://10.0.0.{i}:4001",
            f"http://10.0.0.{i}:5173"
        ])

    return origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_cors_origins(),
    allow_origin_regex=r"https?://[a-zA-Z0-9.-]+\.fly\.dev$",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
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
app.include_router(friendships_router, prefix="/api/friendships", tags=["friendships"])
app.include_router(personal_info_router, prefix="/api", tags=["personal_info"])
app.include_router(highlights_router, prefix="/api", tags=["highlights"])
app.include_router(work_experience_router, prefix="/api", tags=["work_experience"])
app.include_router(education_router, prefix="/api", tags=["education"])

# WebSocket endpoint
@app.websocket("/ws")
async def websocket_handler(websocket: WebSocket, token: str = Query(None)):
    await websocket_endpoint(websocket, token)

# Media router serves files stored in DB
app.include_router(media_router, prefix="/api/media", tags=["media"])

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

# Basic error handling is handled by FastAPI automatically

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=3010,
        reload=True,
        log_level="info"
    )
