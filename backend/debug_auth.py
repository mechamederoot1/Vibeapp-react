#!/usr/bin/env python3

import jwt
import os
from datetime import datetime

def debug_token(token_string):
    """Debug a JWT token"""
    
    SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here")
    ALGORITHM = "HS256"
    
    print(f"🔍 Debugging token:")
    print(f"Token: {token_string[:50]}...")
    print(f"Secret Key: {SECRET_KEY}")
    print(f"Algorithm: {ALGORITHM}")
    print()
    
    try:
        # Decode without verification to see payload
        unverified = jwt.decode(token_string, options={"verify_signature": False})
        print("📋 Unverified payload:")
        for key, value in unverified.items():
            if key == "exp":
                exp_date = datetime.fromtimestamp(value)
                print(f"  {key}: {value} ({exp_date})")
                
                # Check if expired
                if datetime.utcnow() > exp_date:
                    print("  ❌ TOKEN EXPIRED!")
                else:
                    print("  ✅ Token not expired")
            else:
                print(f"  {key}: {value}")
        print()
        
        # Try to decode with verification
        verified = jwt.decode(token_string, SECRET_KEY, algorithms=[ALGORITHM])
        print("✅ Token is valid!")
        print("📋 Verified payload:")
        for key, value in verified.items():
            print(f"  {key}: {value}")
            
    except jwt.ExpiredSignatureError:
        print("❌ Token has expired")
    except jwt.InvalidTokenError as e:
        print(f"❌ Invalid token: {e}")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    # You can paste a token here to debug
    token = input("Cole o token JWT aqui: ").strip()
    if token:
        debug_token(token)
    else:
        print("Nenhum token fornecido")
