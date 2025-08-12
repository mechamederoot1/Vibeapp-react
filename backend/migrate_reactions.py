#!/usr/bin/env python3
"""
Migration script for adding reactions and improving social features
"""
import os
import sys
from sqlalchemy import text

# Add the backend directory to the Python path
backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, backend_dir)

from app.database.database import engine, SessionLocal
from app.models import *

def run_migration():
    """Run the migration to add reactions and improve social features"""
    print("🔄 Running reactions migration...")
    
    with engine.connect() as connection:
        try:
            # Start transaction
            trans = connection.begin()
            
            print("📊 Creating new tables...")
            
            # Create post_reactions table
            connection.execute(text("""
                CREATE TABLE IF NOT EXISTS post_reactions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    post_id INTEGER NOT NULL,
                    reaction_type VARCHAR NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id),
                    FOREIGN KEY (post_id) REFERENCES posts(id),
                    UNIQUE(user_id, post_id)
                )
            """))
            print("✅ Created post_reactions table")
            
            # Create comment_reactions table
            connection.execute(text("""
                CREATE TABLE IF NOT EXISTS comment_reactions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    comment_id INTEGER NOT NULL,
                    reaction_type VARCHAR NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id),
                    FOREIGN KEY (comment_id) REFERENCES comments(id),
                    UNIQUE(user_id, comment_id)
                )
            """))
            print("✅ Created comment_reactions table")
            
            # Add likes_count to comments table if it doesn't exist
            try:
                connection.execute(text("ALTER TABLE comments ADD COLUMN likes_count INTEGER DEFAULT 0"))
                print("✅ Added likes_count to comments table")
            except Exception as e:
                if "duplicate column name" in str(e).lower():
                    print("ℹ️  likes_count column already exists in comments table")
                else:
                    print(f"⚠️  Warning adding likes_count to comments: {e}")
            
            # Ensure shares table exists (might be missing)
            connection.execute(text("""
                CREATE TABLE IF NOT EXISTS shares (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    post_id INTEGER NOT NULL,
                    share_type VARCHAR NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id),
                    FOREIGN KEY (post_id) REFERENCES posts(id)
                )
            """))
            print("✅ Ensured shares table exists")
            
            # Create indexes for better performance
            connection.execute(text("CREATE INDEX IF NOT EXISTS idx_post_reactions_post_id ON post_reactions(post_id)"))
            connection.execute(text("CREATE INDEX IF NOT EXISTS idx_post_reactions_user_id ON post_reactions(user_id)"))
            connection.execute(text("CREATE INDEX IF NOT EXISTS idx_comment_reactions_comment_id ON comment_reactions(comment_id)"))
            connection.execute(text("CREATE INDEX IF NOT EXISTS idx_comment_reactions_user_id ON comment_reactions(user_id)"))
            connection.execute(text("CREATE INDEX IF NOT EXISTS idx_shares_post_id ON shares(post_id)"))
            connection.execute(text("CREATE INDEX IF NOT EXISTS idx_shares_user_id ON shares(user_id)"))
            print("✅ Created performance indexes")
            
            # Commit the transaction
            trans.commit()
            print("✅ Migration completed successfully!")
            
        except Exception as e:
            trans.rollback()
            print(f"❌ Error during migration: {e}")
            raise

def verify_migration():
    """Verify that the migration was successful"""
    print("\n🔍 Verifying migration...")
    
    with engine.connect() as connection:
        try:
            # Check if new tables exist
            result = connection.execute(text("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('post_reactions', 'comment_reactions', 'shares')"))
            tables = [row[0] for row in result]
            
            if 'post_reactions' in tables:
                print("✅ post_reactions table exists")
            else:
                print("❌ post_reactions table missing")
                
            if 'comment_reactions' in tables:
                print("✅ comment_reactions table exists")
            else:
                print("❌ comment_reactions table missing")
                
            if 'shares' in tables:
                print("✅ shares table exists")
            else:
                print("❌ shares table missing")
            
            # Check if likes_count column exists in comments
            result = connection.execute(text("PRAGMA table_info(comments)"))
            columns = [row[1] for row in result]
            
            if 'likes_count' in columns:
                print("✅ likes_count column exists in comments table")
            else:
                print("❌ likes_count column missing in comments table")
                
            print("✅ Migration verification completed!")
            
        except Exception as e:
            print(f"❌ Error during verification: {e}")

if __name__ == "__main__":
    try:
        run_migration()
        verify_migration()
        print("\n🎉 Reactions migration completed successfully!")
        print("📋 New features available:")
        print("   - Post reactions (like, love, laugh, wow, sad, angry)")
        print("   - Comment reactions")
        print("   - Enhanced sharing and reposting")
        print("   - Improved comment management")
        
    except Exception as e:
        print(f"\n💥 Migration failed: {e}")
        sys.exit(1)
