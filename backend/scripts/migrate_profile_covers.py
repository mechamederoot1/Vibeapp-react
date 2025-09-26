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
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS profile_covers (
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
        CREATE INDEX IF NOT EXISTS idx_profile_covers_user_created
        ON profile_covers(user_id, created_at DESC)
        """
    )
    cur.execute(
        """
        CREATE UNIQUE INDEX IF NOT EXISTS uq_profile_covers_user_hash
        ON profile_covers(user_id, blob_hash)
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
        # Ensure cover columns exist
        if not column_exists(cur, 'users', 'cover_blob') or not column_exists(cur, 'users', 'cover_mime'):
            print('⚠️ Columns cover_blob/cover_mime not found on users, nothing to migrate')
            return False

        # Backfill profile_covers from users.cover_blob
        cur.execute("SELECT id, cover_blob, cover_mime, COALESCE(updated_at, created_at) FROM users WHERE cover_blob IS NOT NULL")
        rows = cur.fetchall()
        inserted = 0
        skipped = 0
        for user_id, blob, mime, ts in rows:
            if blob is None:
                skipped += 1
                continue
            h = hashlib.sha256(blob).hexdigest()
            cur.execute("SELECT id FROM profile_covers WHERE user_id= ? AND blob_hash= ? LIMIT 1", (user_id, h))
            if cur.fetchone():
                skipped += 1
                continue
            # unique id
            while True:
                cover_id = generate_vibe_id(18)
                cur.execute("SELECT 1 FROM profile_covers WHERE id= ?", (cover_id,))
                if cur.fetchone() is None:
                    break
            created_at = ts if ts else datetime.utcnow().isoformat()
            cur.execute(
                "INSERT INTO profile_covers (id, user_id, blob, mime, blob_hash, created_at) VALUES (?, ?, ?, ?, ?, ?)",
                (cover_id, user_id, sqlite3.Binary(blob), mime, h, created_at)
            )
            inserted += 1

        # Optionally, update posts of type profile_update/cover to point to immutable cover URL when matching hash exists
        if table_exists(cur, 'posts') and column_exists(cur, 'posts', 'post_type') and column_exists(cur, 'posts', 'profile_update_type'):
            # Ensure image_blob column exists to match by hash
            if column_exists(cur, 'posts', 'image_blob'):
                cur.execute("""
                    SELECT p.id, p.author_id, p.image_blob
                    FROM posts p
                    WHERE p.post_type = 'profile_update' AND p.profile_update_type = 'cover' AND p.image_blob IS NOT NULL
                """)
                cover_posts = cur.fetchall()
                updated = 0
                for post_id, author_id, pblob in cover_posts:
                    ph = hashlib.sha256(pblob).hexdigest()
                    cur.execute("SELECT id FROM profile_covers WHERE user_id= ? AND blob_hash= ? LIMIT 1", (author_id, ph))
                    row = cur.fetchone()
                    if row and row[0]:
                        cover_id = row[0]
                        url = f"/api/media/profile/cover/id/{cover_id}"
                        cur.execute("UPDATE posts SET image_url = ? WHERE id = ?", (url, post_id))
                        updated += 1
                if updated:
                    print(f"🔗 Updated {updated} profile_update cover posts to immutable cover URLs")

        conn.commit()
        print(f"✅ Profile covers migration complete. Inserted: {inserted}, Skipped: {skipped}")
        return True
    except Exception as e:
        conn.rollback()
        print(f"❌ Migration failed: {e}")
        return False
    finally:
        conn.close()


if __name__ == '__main__':
    migrate()
