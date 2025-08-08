#!/usr/bin/env python3
"""
Quick database fix for missing columns
"""
import sqlite3
import os
from pathlib import Path

def fix_database():
    """Fix database by adding missing columns"""
    
    # Find the database file
    possible_paths = [
        "backend/vibe_social.db",
        "vibe_social.db",
        "backend/app.db",
        "app.db"
    ]
    
    db_path = None
    for path in possible_paths:
        if os.path.exists(path):
            db_path = path
            break
    
    if not db_path:
        print("❌ Database file not found. Creating new database structure...")
        # If no database exists, we'll create it with the correct schema
        db_path = "backend/vibe_social.db"
        
    print(f"🔧 Working with database: {db_path}")
    
    try:
        # Connect to database
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check if posts table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='posts'")
        posts_table_exists = cursor.fetchone()
        
        if not posts_table_exists:
            print("❌ Posts table doesn't exist. This looks like a fresh database.")
            print("✅ The backend will create the correct schema when it starts.")
            conn.close()
            return
        
        # List of columns to add
        columns_to_add = [
            ("background_color", "VARCHAR"),
            ("profile_update_type", "VARCHAR")
        ]
        
        # Get current columns
        cursor.execute("PRAGMA table_info(posts)")
        existing_columns = [row[1] for row in cursor.fetchall()]
        print(f"📋 Existing columns: {existing_columns}")
        
        applied_fixes = 0
        
        for column_name, column_type in columns_to_add:
            if column_name not in existing_columns:
                try:
                    alter_sql = f"ALTER TABLE posts ADD COLUMN {column_name} {column_type}"
                    cursor.execute(alter_sql)
                    print(f"✅ Added column: {column_name}")
                    applied_fixes += 1
                except sqlite3.Error as e:
                    print(f"❌ Error adding {column_name}: {e}")
            else:
                print(f"⏭️  Column {column_name} already exists")
        
        # Commit changes
        conn.commit()
        conn.close()
        
        print(f"\n🎉 Database fix completed! {applied_fixes} columns added.")
        print("✅ The backend should now start without column errors.")
        
    except sqlite3.Error as e:
        print(f"❌ Database error: {e}")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")

if __name__ == "__main__":
    print("🚀 Starting database fix...")
    fix_database()
