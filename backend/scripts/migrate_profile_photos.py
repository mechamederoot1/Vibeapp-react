#!/usr/bin/env python3
import os
import sqlite3
import hashlib
import secrets
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'vibe_social.db')

DIGITS = '0123456789'

def generate_vibe_id(length: int = 18) -> str:
    return 'vibe_' + ''.join(secrets.choice(DIGITS) for _ in range(length))


def table_exists(cur, name: str) -> bool:
    cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name= ?", (name,))
    return cur.fetchone() is not None


def column_exists(cur, table: str, column: str) -> bool:
    cur.execute(f"PRAGMA table_info({table})")
    return any(row[1] == column for row in cur.fetchall())


def ensure_schema(conn):
    cur = conn.cursor()
    # Create table only if not present
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS profile_photos (
            id TEXT PRIMARY KEY,
            user_id INTEGER NOT NULL,
            blob BLOB NOT NULL,
            mime TEXT,
            blob_hash TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
        """
    )
    cur.execute(
        """
        CREATE INDEX IF NOT EXISTS idx_profile_photos_user_created
        ON profile_photos(user_id, created_at DESC)
        """
    )
    cur.execute(
        """
        CREATE UNIQUE INDEX IF NOT EXISTS uq_profile_photos_user_hash
        ON profile_photos(user_id, blob_hash)
        """
    )
    conn.commit()


def migrate() -> bool:
    if not os.path.exists(DB_PATH):
        print(f"❌ Database not found at {DB_PATH}")
        return False

    conn = sqlite3.connect(DB_PATH)
    try:
        conn.execute('PRAGMA foreign_keys=ON')
        ensure_schema(conn)
        cur = conn.cursor()

        if not table_exists(cur, 'users'):
            print('❌ Table users not found, skipping migration')
            return False
        # Ensure avatar columns exist
        if not column_exists(cur, 'users', 'avatar_blob') or not column_exists(cur, 'users', 'avatar_mime'):
            print('⚠️ Columns avatar_blob/avatar_mime not found on users, nothing to migrate')
            return False

        # Read users with avatar
        cur.execute("SELECT id, avatar_blob, avatar_mime, COALESCE(updated_at, created_at) FROM users WHERE avatar_blob IS NOT NULL")
        rows = cur.fetchall()
        inserted = 0
        skipped = 0

        for user_id, blob, mime, ts in rows:
            if blob is None:
                skipped += 1
                continue
            # Compute hash for deduplication
            h = hashlib.sha256(blob).hexdigest()
            cur.execute("SELECT id FROM profile_photos WHERE user_id= ? AND blob_hash= ? LIMIT 1", (user_id, h))
            if cur.fetchone():
                skipped += 1
                continue
            # Generate unique id (ensure not colliding in DB)
            while True:
                photo_id = generate_vibe_id(18)
                cur.execute("SELECT 1 FROM profile_photos WHERE id= ?", (photo_id,))
                if cur.fetchone() is None:
                    break
            # Insert historical record
            created_at = ts if ts else datetime.utcnow().isoformat()
            cur.execute(
                "INSERT INTO profile_photos (id, user_id, blob, mime, blob_hash, created_at) VALUES (?, ?, ?, ?, ?, ?)",
                (photo_id, user_id, sqlite3.Binary(blob), mime, h, created_at)
            )
            inserted += 1

        conn.commit()
        print(f"✅ Migration complete. Inserted: {inserted}, Skipped (duplicates/missing): {skipped}")
        return True
    except Exception as e:
        conn.rollback()
        print(f"❌ Migration failed: {e}")
        return False
    finally:
        conn.close()


if __name__ == '__main__':
    migrate()
