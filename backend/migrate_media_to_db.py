#!/usr/bin/env python3
"""
Migration script to add BLOB columns to SQLite tables and migrate existing files from uploads/ into DB blob columns.
Usage:
  - Backup your DB before running: cp backend/vibe_social.db backend/vibe_social.db.bak
  - Run: python3 backend/migrate_media_to_db.py

This script will:
  1. Execute ALTER TABLE statements to add new columns (if they don't exist).
  2. Scan the uploads/ directory for referenced files and store their bytes and mime types in the DB.
  3. Update the corresponding "_url" fields to point to the new /api/media/ endpoints.

It will NOT delete the original files. Review the results and delete uploads/ manually if desired.
"""

import os
import sqlite3
import mimetypes
import pathlib
import sys
from contextlib import closing

ROOT = os.path.dirname(__file__)
DB_PATH = os.path.join(ROOT, 'vibe_social.db')
UPLOADS_DIR = os.path.join(ROOT, 'uploads')

if not os.path.exists(DB_PATH):
    print(f"Database not found at {DB_PATH}")
    sys.exit(1)

# SQL to add columns (SQLite supports ADD COLUMN)
ALTER_SQL = [
    "ALTER TABLE posts ADD COLUMN image_blob BLOB;",
    "ALTER TABLE posts ADD COLUMN image_mime TEXT;",
    "ALTER TABLE posts ADD COLUMN video_blob BLOB;",
    "ALTER TABLE posts ADD COLUMN video_mime TEXT;",

    "ALTER TABLE stories ADD COLUMN media_blob BLOB;",
    "ALTER TABLE stories ADD COLUMN media_mime TEXT;",

    "ALTER TABLE users ADD COLUMN avatar_blob BLOB;",
    "ALTER TABLE users ADD COLUMN avatar_mime TEXT;",
    "ALTER TABLE users ADD COLUMN cover_blob BLOB;",
    "ALTER TABLE users ADD COLUMN cover_mime TEXT;",

    "ALTER TABLE messages ADD COLUMN media_blob BLOB;",
    "ALTER TABLE messages ADD COLUMN media_mime TEXT;",
]

# Helper to safely run ALTER statements if column doesn't exist
def table_has_column(conn, table, column):
    cur = conn.execute(f"PRAGMA table_info({table});")
    cols = [r[1] for r in cur.fetchall()]
    return column in cols

def add_columns(conn):
    print("Checking and adding missing columns...")
    # posts
    if not table_has_column(conn, 'posts', 'image_blob'):
        conn.execute("ALTER TABLE posts ADD COLUMN image_blob BLOB;")
        print("Added posts.image_blob")
    if not table_has_column(conn, 'posts', 'image_mime'):
        conn.execute("ALTER TABLE posts ADD COLUMN image_mime TEXT;")
        print("Added posts.image_mime")
    if not table_has_column(conn, 'posts', 'video_blob'):
        conn.execute("ALTER TABLE posts ADD COLUMN video_blob BLOB;")
        print("Added posts.video_blob")
    if not table_has_column(conn, 'posts', 'video_mime'):
        conn.execute("ALTER TABLE posts ADD COLUMN video_mime TEXT;")
        print("Added posts.video_mime")

    # stories
    if not table_has_column(conn, 'stories', 'media_blob'):
        conn.execute("ALTER TABLE stories ADD COLUMN media_blob BLOB;")
        print("Added stories.media_blob")
    if not table_has_column(conn, 'stories', 'media_mime'):
        conn.execute("ALTER TABLE stories ADD COLUMN media_mime TEXT;")
        print("Added stories.media_mime")

    # users
    if not table_has_column(conn, 'users', 'avatar_blob'):
        conn.execute("ALTER TABLE users ADD COLUMN avatar_blob BLOB;")
        print("Added users.avatar_blob")
    if not table_has_column(conn, 'users', 'avatar_mime'):
        conn.execute("ALTER TABLE users ADD COLUMN avatar_mime TEXT;")
        print("Added users.avatar_mime")
    if not table_has_column(conn, 'users', 'cover_blob'):
        conn.execute("ALTER TABLE users ADD COLUMN cover_blob BLOB;")
        print("Added users.cover_blob")
    if not table_has_column(conn, 'users', 'cover_mime'):
        conn.execute("ALTER TABLE users ADD COLUMN cover_mime TEXT;")
        print("Added users.cover_mime")

    # messages
    if not table_has_column(conn, 'messages', 'media_blob'):
        conn.execute("ALTER TABLE messages ADD COLUMN media_blob BLOB;")
        print("Added messages.media_blob")
    if not table_has_column(conn, 'messages', 'media_mime'):
        conn.execute("ALTER TABLE messages ADD COLUMN media_mime TEXT;")
        print("Added messages.media_mime")

    conn.commit()

# Migrate file referenced by a URL like /uploads/avatars/xxx -> store blob and set URL to /api/media/...
def migrate_user_media(conn):
    cur = conn.cursor()
    rows = cur.execute("SELECT id, avatar, cover_photo FROM users").fetchall()
    updated = 0
    for user_id, avatar, cover in rows:
        if avatar and avatar.startswith('/uploads/'):
            path = os.path.join(ROOT, avatar.lstrip('/'))
            if os.path.exists(path):
                with open(path, 'rb') as f:
                    data = f.read()
                mime = mimetypes.guess_type(path)[0] or 'application/octet-stream'
                cur.execute("UPDATE users SET avatar_blob=?, avatar_mime=?, avatar=? WHERE id=?", (data, mime, f"/api/media/users/{user_id}/avatar", user_id))
                updated += 1
        if cover and cover.startswith('/uploads/'):
            path = os.path.join(ROOT, cover.lstrip('/'))
            if os.path.exists(path):
                with open(path, 'rb') as f:
                    data = f.read()
                mime = mimetypes.guess_type(path)[0] or 'application/octet-stream'
                cur.execute("UPDATE users SET cover_blob=?, cover_mime=?, cover_photo=? WHERE id=?", (data, mime, f"/api/media/users/{user_id}/cover", user_id))
                updated += 1
    conn.commit()
    print(f"Migrated {updated} user media entries")

def migrate_posts_media(conn):
    cur = conn.cursor()
    rows = cur.execute("SELECT id, image_url, video_url FROM posts").fetchall()
    updated = 0
    for post_id, image_url, video_url in rows:
        if image_url and image_url.startswith('/uploads/'):
            path = os.path.join(ROOT, image_url.lstrip('/'))
            if os.path.exists(path):
                with open(path, 'rb') as f:
                    data = f.read()
                mime = mimetypes.guess_type(path)[0] or 'application/octet-stream'
                cur.execute("UPDATE posts SET image_blob=?, image_mime=?, image_url=? WHERE id=?", (data, mime, f"/api/media/posts/{post_id}/image", post_id))
                updated += 1
        if video_url and video_url.startswith('/uploads/'):
            path = os.path.join(ROOT, video_url.lstrip('/'))
            if os.path.exists(path):
                with open(path, 'rb') as f:
                    data = f.read()
                mime = mimetypes.guess_type(path)[0] or 'application/octet-stream'
                cur.execute("UPDATE posts SET video_blob=?, video_mime=?, video_url=? WHERE id=?", (data, mime, f"/api/media/posts/{post_id}/video", post_id))
                updated += 1
    conn.commit()
    print(f"Migrated {updated} posts media entries")

def migrate_stories_media(conn):
    cur = conn.cursor()
    rows = cur.execute("SELECT id, media_url FROM stories").fetchall()
    updated = 0
    for story_id, media_url in rows:
        if media_url and media_url.startswith('/uploads/'):
            path = os.path.join(ROOT, media_url.lstrip('/'))
            if os.path.exists(path):
                with open(path, 'rb') as f:
                    data = f.read()
                mime = mimetypes.guess_type(path)[0] or 'application/octet-stream'
                cur.execute("UPDATE stories SET media_blob=?, media_mime=?, media_url=? WHERE id=?", (data, mime, f"/api/media/stories/{story_id}", story_id))
                updated += 1
    conn.commit()
    print(f"Migrated {updated} stories media entries")

def migrate_messages_media(conn):
    cur = conn.cursor()
    rows = cur.execute("SELECT id, media_url FROM messages").fetchall()
    updated = 0
    for message_id, media_url in rows:
        if media_url and media_url.startswith('/uploads/'):
            path = os.path.join(ROOT, media_url.lstrip('/'))
            if os.path.exists(path):
                with open(path, 'rb') as f:
                    data = f.read()
                mime = mimetypes.guess_type(path)[0] or 'application/octet-stream'
                cur.execute("UPDATE messages SET media_blob=?, media_mime=?, media_url=? WHERE id=?", (data, mime, f"/api/media/messages/{message_id}", message_id))
                updated += 1
    conn.commit()
    print(f"Migrated {updated} messages media entries")


def main():
    backup = DB_PATH + '.bak'
    if not os.path.exists(backup):
        print(f"Creating backup {backup} ...")
        open(backup, 'wb').write(open(DB_PATH, 'rb').read())
        print("Backup created")
    else:
        print(f"Backup already exists at {backup}")

    with closing(sqlite3.connect(DB_PATH)) as conn:
        conn.row_factory = sqlite3.Row
        add_columns(conn)
        migrate_user_media(conn)
        migrate_posts_media(conn)
        migrate_stories_media(conn)
        migrate_messages_media(conn)

    print("Migration complete. Please restart the backend and test endpoints.")

if __name__ == '__main__':
    main()
