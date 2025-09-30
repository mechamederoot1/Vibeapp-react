"""
Unified migration runner to create tables, add missing columns, backfill data, and ensure indexes.
Safe to run multiple times.
"""
import os
import sys
import random
import string
import hashlib
from datetime import datetime
from sqlalchemy import text, inspect

# Ensure backend root on sys.path
PARENT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PARENT not in sys.path:
    sys.path.insert(0, PARENT)

from app.database.database import engine, SessionLocal, Base
from app.models import *  # Register all models

DIGITS = '0123456789'

def _has_col(conn, table: str, col: str) -> bool:
    res = conn.execute(text(f"PRAGMA table_info({table})"))
    return any(row[1] == col for row in res.fetchall())

def _ensure_optional_columns():
    """Add optional blob/mime columns if missing (SQLite-safe)."""
    with engine.begin() as conn:
        # users
        if not _has_col(conn, 'users', 'avatar_blob'):
            conn.execute(text("ALTER TABLE users ADD COLUMN avatar_blob BLOB"))
        if not _has_col(conn, 'users', 'avatar_mime'):
            conn.execute(text("ALTER TABLE users ADD COLUMN avatar_mime TEXT"))
        if not _has_col(conn, 'users', 'cover_blob'):
            conn.execute(text("ALTER TABLE users ADD COLUMN cover_blob BLOB"))
        if not _has_col(conn, 'users', 'cover_mime'):
            conn.execute(text("ALTER TABLE users ADD COLUMN cover_mime TEXT"))
        # posts
        if not _has_col(conn, 'posts', 'image_blob'):
            conn.execute(text("ALTER TABLE posts ADD COLUMN image_blob BLOB"))
        if not _has_col(conn, 'posts', 'image_mime'):
            conn.execute(text("ALTER TABLE posts ADD COLUMN image_mime TEXT"))
        if not _has_col(conn, 'posts', 'video_blob'):
            conn.execute(text("ALTER TABLE posts ADD COLUMN video_blob BLOB"))
        if not _has_col(conn, 'posts', 'video_mime'):
            conn.execute(text("ALTER TABLE posts ADD COLUMN video_mime TEXT"))
        # stories
        if not _has_col(conn, 'stories', 'media_blob'):
            conn.execute(text("ALTER TABLE stories ADD COLUMN media_blob BLOB"))
        if not _has_col(conn, 'stories', 'media_mime'):
            conn.execute(text("ALTER TABLE stories ADD COLUMN media_mime TEXT"))
        # messages
        if not _has_col(conn, 'messages', 'media_blob'):
            conn.execute(text("ALTER TABLE messages ADD COLUMN media_blob BLOB"))
        if not _has_col(conn, 'messages', 'media_mime'):
            conn.execute(text("ALTER TABLE messages ADD COLUMN media_mime TEXT"))
        if not _has_col(conn, 'messages', 'conversation_id'):
            conn.execute(text("ALTER TABLE messages ADD COLUMN conversation_id INTEGER"))
        if not _has_col(conn, 'messages', 'is_delivered'):
            conn.execute(text("ALTER TABLE messages ADD COLUMN is_delivered BOOLEAN DEFAULT 0"))
        if not _has_col(conn, 'messages', 'delivered_at'):
            conn.execute(text("ALTER TABLE messages ADD COLUMN delivered_at DATETIME"))
        if not _has_col(conn, 'messages', 'is_read'):
            conn.execute(text("ALTER TABLE messages ADD COLUMN is_read BOOLEAN DEFAULT 0"))
        if not _has_col(conn, 'messages', 'read_at'):
            conn.execute(text("ALTER TABLE messages ADD COLUMN read_at DATETIME"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_messages_conversation_id ON messages(conversation_id)"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_messages_is_delivered ON messages(is_delivered)"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_messages_delivered_at ON messages(delivered_at)"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_messages_is_read ON messages(is_read)"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_messages_read_at ON messages(read_at)"))

        # user sessions table (tracks tokens per device/browser)
        conn.execute(text(
            """
            CREATE TABLE IF NOT EXISTS user_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                jti TEXT NOT NULL UNIQUE,
                user_agent TEXT,
                ip_address TEXT,
                is_active BOOLEAN DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                last_used_at DATETIME
            )
            """
        ))
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_user_sessions_user_id ON user_sessions(user_id)"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_user_sessions_jti ON user_sessions(jti)"))

def _ensure_work_education_tables():
    """Ensure tables and essential columns/indexes for multiple work/education entries (SQLite-safe)."""
    with engine.begin() as conn:
        # Work experiences table
        conn.execute(text(
            """
            CREATE TABLE IF NOT EXISTS work_experiences (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                company TEXT NOT NULL,
                position TEXT NOT NULL,
                description TEXT,
                start_date DATE,
                end_date DATE,
                is_current BOOLEAN DEFAULT 0,
                order_index INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
            """
        ))
        # Add missing columns if table already existed
        if not _has_col(conn, 'work_experiences', 'description'):
            conn.execute(text("ALTER TABLE work_experiences ADD COLUMN description TEXT"))
        if not _has_col(conn, 'work_experiences', 'start_date'):
            conn.execute(text("ALTER TABLE work_experiences ADD COLUMN start_date DATE"))
        if not _has_col(conn, 'work_experiences', 'end_date'):
            conn.execute(text("ALTER TABLE work_experiences ADD COLUMN end_date DATE"))
        if not _has_col(conn, 'work_experiences', 'is_current'):
            conn.execute(text("ALTER TABLE work_experiences ADD COLUMN is_current BOOLEAN DEFAULT 0"))
        if not _has_col(conn, 'work_experiences', 'order_index'):
            conn.execute(text("ALTER TABLE work_experiences ADD COLUMN order_index INTEGER DEFAULT 0"))
        if not _has_col(conn, 'work_experiences', 'created_at'):
            conn.execute(text("ALTER TABLE work_experiences ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP"))
        if not _has_col(conn, 'work_experiences', 'updated_at'):
            conn.execute(text("ALTER TABLE work_experiences ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP"))
        # Indexes
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_work_experiences_user ON work_experiences(user_id)"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_work_experiences_user_order_created ON work_experiences(user_id, order_index DESC, created_at DESC)"))

        # Education table
        conn.execute(text(
            """
            CREATE TABLE IF NOT EXISTS education (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                institution TEXT NOT NULL,
                degree TEXT NOT NULL,
                field TEXT,
                description TEXT,
                start_date DATE,
                end_date DATE,
                is_current BOOLEAN DEFAULT 0,
                order_index INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
            """
        ))
        # Add missing columns
        if not _has_col(conn, 'education', 'field'):
            conn.execute(text("ALTER TABLE education ADD COLUMN field TEXT"))
        if not _has_col(conn, 'education', 'description'):
            conn.execute(text("ALTER TABLE education ADD COLUMN description TEXT"))
        if not _has_col(conn, 'education', 'start_date'):
            conn.execute(text("ALTER TABLE education ADD COLUMN start_date DATE"))
        if not _has_col(conn, 'education', 'end_date'):
            conn.execute(text("ALTER TABLE education ADD COLUMN end_date DATE"))
        if not _has_col(conn, 'education', 'is_current'):
            conn.execute(text("ALTER TABLE education ADD COLUMN is_current BOOLEAN DEFAULT 0"))
        if not _has_col(conn, 'education', 'order_index'):
            conn.execute(text("ALTER TABLE education ADD COLUMN order_index INTEGER DEFAULT 0"))
        if not _has_col(conn, 'education', 'created_at'):
            conn.execute(text("ALTER TABLE education ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP"))
        if not _has_col(conn, 'education', 'updated_at'):
            conn.execute(text("ALTER TABLE education ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP"))
        # Indexes
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_education_user ON education(user_id)"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_education_user_order_created ON education(user_id, order_index DESC, created_at DESC)"))


def _backfill_message_conversations():
    session = SessionLocal()
    try:
        query = (
            session.query(Message)
            .filter(Message.conversation_id.is_(None))
            .order_by(Message.created_at)
        )
        processed = 0
        for message in query.yield_per(200):
            if message.sender_id is None or message.receiver_id is None:
                continue
            user_ids = sorted([message.sender_id, message.receiver_id])
            conv = (
                session.query(Conversation)
                .filter(
                    Conversation.user1_id == user_ids[0],
                    Conversation.user2_id == user_ids[1]
                )
                .first()
            )
            if not conv:
                timestamp = message.created_at or datetime.utcnow()
                conv = Conversation(
                    user1_id=user_ids[0],
                    user2_id=user_ids[1],
                    created_at=timestamp,
                    updated_at=timestamp
                )
                session.add(conv)
                session.flush()
            message.conversation_id = conv.id
            message_time = message.created_at or datetime.utcnow()
            if not conv.updated_at or message_time >= conv.updated_at:
                conv.updated_at = message_time
                conv.last_message_id = message.id
            processed += 1
            if processed % 200 == 0:
                session.commit()
        session.commit()
    finally:
        session.close()


def _migrate_public_profile_id(db):
    # add column
    if not _has_col(db, 'users', 'public_profile_id'):
        db.execute(text("ALTER TABLE users ADD COLUMN public_profile_id TEXT"))
        db.commit()
    # index
    db.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_public_profile_id ON users(public_profile_id)"))
    db.commit()
    # populate
    rows = db.execute(text("SELECT id FROM users WHERE public_profile_id IS NULL OR public_profile_id = ''")).fetchall()
    for (uid,) in rows:
        # retry unique id
        for _ in range(10):
            pid = ''.join(random.SystemRandom().choice(string.digits) for _ in range(10))
            try:
                db.execute(text("UPDATE users SET public_profile_id = :pid WHERE id = :uid"), {"pid": pid, "uid": uid})
                db.commit()
                break
            except Exception:
                db.rollback()
                continue


def _migrate_post_public_id(db):
    # add column
    if not _has_col(db, 'posts', 'public_id'):
        db.execute(text("ALTER TABLE posts ADD COLUMN public_id TEXT"))
        db.commit()
    # index
    db.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS idx_posts_public_id ON posts(public_id)"))
    db.commit()
    # populate
    rows = db.execute(text("SELECT id FROM posts WHERE public_id IS NULL OR public_id = ''")).fetchall()
    for (pid,) in rows:
        for _ in range(10):
            pub = ''.join(random.SystemRandom().choice(string.digits) for _ in range(10))
            try:
                db.execute(text("UPDATE posts SET public_id = :pub WHERE id = :id"), {"pub": pub, "id": pid})
                db.commit()
                break
            except Exception:
                db.rollback()
                continue


def _ensure_profile_photos_table(db):
    # Create table/indexes if not exists using SQL
    db.execute(text("""
        CREATE TABLE IF NOT EXISTS profile_photos (
            id TEXT PRIMARY KEY,
            user_id INTEGER NOT NULL,
            blob BLOB NOT NULL,
            mime TEXT,
            blob_hash TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """))
    db.execute(text("CREATE INDEX IF NOT EXISTS idx_profile_photos_user_created ON profile_photos(user_id, created_at DESC)"))
    db.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS uq_profile_photos_user_hash ON profile_photos(user_id, blob_hash)"))
    db.commit()


def _ensure_profile_covers_table(db):
    db.execute(text("""
        CREATE TABLE IF NOT EXISTS profile_covers (
            id TEXT PRIMARY KEY,
            user_id INTEGER NOT NULL,
            blob BLOB NOT NULL,
            mime TEXT,
            blob_hash TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """))
    db.execute(text("CREATE INDEX IF NOT EXISTS idx_profile_covers_user_created ON profile_covers(user_id, created_at DESC)"))
    db.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS uq_profile_covers_user_hash ON profile_covers(user_id, blob_hash)"))
    db.commit()


def _backfill_profile_photos(db):
    _ensure_profile_photos_table(db)
    rows = db.execute(text("SELECT id, avatar_blob, avatar_mime, COALESCE(updated_at, created_at) FROM users WHERE avatar_blob IS NOT NULL")).fetchall()
    for (user_id, blob, mime, ts) in rows:
        if blob is None:
            continue
        h = hashlib.sha256(blob).hexdigest()
        exists = db.execute(text("SELECT 1 FROM profile_photos WHERE user_id = :u AND blob_hash = :h LIMIT 1"), {"u": user_id, "h": h}).fetchone()
        if exists:
            continue
        # generate ID
        while True:
            photo_id = 'vibe_' + ''.join(random.SystemRandom().choice(DIGITS) for _ in range(18))
            if not db.execute(text("SELECT 1 FROM profile_photos WHERE id = :id"), {"id": photo_id}).fetchone():
                break
        created_at = ts if ts else datetime.utcnow().isoformat()
        db.execute(text("INSERT INTO profile_photos (id, user_id, blob, mime, blob_hash, created_at) VALUES (:id, :uid, :blob, :mime, :hash, :created)"),
                   {"id": photo_id, "uid": user_id, "blob": blob, "mime": mime, "hash": h, "created": created_at})
    db.commit()


def _backfill_profile_covers_and_update_posts(db):
    _ensure_profile_covers_table(db)
    rows = db.execute(text("SELECT id, cover_blob, cover_mime, COALESCE(updated_at, created_at) FROM users WHERE cover_blob IS NOT NULL")).fetchall()
    for (user_id, blob, mime, ts) in rows:
        if blob is None:
            continue
        h = hashlib.sha256(blob).hexdigest()
        exists = db.execute(text("SELECT 1 FROM profile_covers WHERE user_id = :u AND blob_hash = :h LIMIT 1"), {"u": user_id, "h": h}).fetchone()
        cover_id = None
        if not exists:
            while True:
                cover_id = 'vibe_' + ''.join(random.SystemRandom().choice(DIGITS) for _ in range(18))
                if not db.execute(text("SELECT 1 FROM profile_covers WHERE id = :id"), {"id": cover_id}).fetchone():
                    break
            created_at = ts if ts else datetime.utcnow().isoformat()
            db.execute(text("INSERT INTO profile_covers (id, user_id, blob, mime, blob_hash, created_at) VALUES (:id, :uid, :blob, :mime, :hash, :created)"),
                       {"id": cover_id, "uid": user_id, "blob": blob, "mime": mime, "hash": h, "created": created_at})
            db.commit()
        else:
            # fetch existing id
            row = db.execute(text("SELECT id FROM profile_covers WHERE user_id = :u AND blob_hash = :h LIMIT 1"), {"u": user_id, "h": h}).fetchone()
            cover_id = row[0] if row else None
        # Update posts pointing to this cover
        if cover_id and _has_col(db, 'posts', 'image_blob') and _has_col(db, 'posts', 'post_type') and _has_col(db, 'posts', 'profile_update_type'):
            # Find posts with same blob
            posts = db.execute(text("""
                SELECT id FROM posts WHERE post_type='profile_update' AND profile_update_type='cover' AND image_blob IS NOT NULL
            """)).fetchall()
            for (pid,) in posts:
                # We cannot compare blob hash easily in SQL; set URL optimistically if image_blob matches by hash
                pblob = db.execute(text("SELECT image_blob FROM posts WHERE id=:id"), {"id": pid}).fetchone()[0]
                if pblob is None:
                    continue
                if hashlib.sha256(pblob).hexdigest() == h:
                    url = f"/api/media/profile/cover/id/{cover_id}"
                    db.execute(text("UPDATE posts SET image_url = :u WHERE id = :id"), {"u": url, "id": pid})
            db.commit()


def _add_indexes():
    statements = [
        # Posts
        "CREATE INDEX IF NOT EXISTS ix_posts_created_at ON posts (created_at)",
        "CREATE INDEX IF NOT EXISTS ix_posts_author_id_created_at ON posts (author_id, created_at)",
        # Comments
        "CREATE INDEX IF NOT EXISTS ix_comments_post_id_created_at ON comments (post_id, created_at)",
        # Shares
        "CREATE INDEX IF NOT EXISTS ix_shares_post_id_created_at ON shares (post_id, created_at)",
        # Post likes
        "CREATE INDEX IF NOT EXISTS ix_post_likes_user_id_post_id ON post_likes (user_id, post_id)",
    ]
    with engine.begin() as conn:
        for sql in statements:
            conn.execute(text(sql))


def _migrate_work_education():
    # Create tables via SQLAlchemy metadata
    Base.metadata.create_all(bind=engine)
    # Move data from personal_info if needed
    db = SessionLocal()
    try:
        from app.models.personal_info import PersonalInfo
        from app.models.work_experience import WorkExperience
        from app.models.education import Education
        personal_infos = db.query(PersonalInfo).filter(
            (PersonalInfo.work_company.isnot(None)) | (PersonalInfo.education_institution.isnot(None))
        ).all()
        for pi in personal_infos:
            if pi.work_company or pi.work_position:
                exists = db.query(WorkExperience).filter(WorkExperience.user_id == pi.user_id).first()
                if not exists:
                    db.add(WorkExperience(
                        user_id=pi.user_id,
                        company=pi.work_company or "Empresa",
                        position=pi.work_position or "Cargo",
                        description=pi.work_description,
                        start_date=pi.work_start_date,
                        end_date=pi.work_end_date,
                        is_current=pi.work_is_current or False,
                        order_index=0
                    ))
            if pi.education_institution or pi.education_degree:
                exists = db.query(Education).filter(Education.user_id == pi.user_id).first()
                if not exists:
                    db.add(Education(
                        user_id=pi.user_id,
                        institution=pi.education_institution or "Instituição",
                        degree=pi.education_degree or "Curso",
                        field=pi.education_field,
                        start_date=pi.education_start_date,
                        end_date=pi.education_end_date,
                        is_current=pi.education_is_current or False,
                        order_index=0
                    ))
        db.commit()
    finally:
        db.close()


def migrate_all() -> bool:
    try:
        print("🔄 Running unified migrations...")
        # 1) Create all tables from models first
        Base.metadata.create_all(bind=engine)
        # 2) Ensure optional columns
        _ensure_optional_columns()
        # 2a) Backfill message conversation relationships and statuses
        _backfill_message_conversations()
        # 2b) Ensure work/education tables and columns for multiple entries
        _ensure_work_education_tables()
        # 3) Data/ID migrations
        db = SessionLocal()
        try:
            _migrate_public_profile_id(db)
            _migrate_post_public_id(db)
            _backfill_profile_photos(db)
            _backfill_profile_covers_and_update_posts(db)
        finally:
            db.close()
        # 4) Additional data migrations
        _migrate_work_education()
        # 5) Indexes
        _add_indexes()
        print("✅ Unified migrations completed")
        return True
    except Exception as e:
        print(f"❌ Unified migration failed: {e}")
        return False

if __name__ == '__main__':
    migrate_all()
