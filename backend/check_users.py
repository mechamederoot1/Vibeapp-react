#!/usr/bin/env python3

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database.database import SessionLocal
from app.models.user import User
from app.api.auth import create_access_token

def check_users():
    """Check existing users in database"""
    db = SessionLocal()
    
    try:
        users = db.query(User).all()
        
        print(f"👥 Found {len(users)} users in database:")
        print("-" * 50)
        
        for user in users:
            print(f"ID: {user.id}")
            print(f"Email: {user.email}")
            print(f"Username: {user.username}")
            print(f"Name: {user.first_name} {user.last_name}")
            print(f"Active: {user.is_active}")
            print(f"Created: {user.created_at}")
            
            # Generate a token for this user
            token = create_access_token(data={"sub": str(user.id)})
            print(f"Sample Token: {token[:50]}...")
            print("-" * 50)
            
        if len(users) == 0:
            print("⚠️  No users found! You need to register or create test users.")
            print("💡 Try running: python create_test_users.py")
            
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_users()
