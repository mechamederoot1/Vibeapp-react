#!/usr/bin/env python3
import sys
import os

# Ensure backend root is on sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.database.database import engine


def migrate():
    """
    Create missing indexes to improve pagination and lookups.
    Safe to run multiple times (uses IF NOT EXISTS).
    """
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
    return True

if __name__ == "__main__":
    ok = migrate()
    print("✅ Index migration done" if ok else "❌ Index migration failed")
