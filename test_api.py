#!/usr/bin/env python3
"""
Script simples para testar a API
"""
import requests
import json

def test_create_users():
    try:
        print("🚀 Tentando criar usuários teste...")
        response = requests.post('http://localhost:8000/api/dev/create-test-users')
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Sucesso!")
            print(f"📊 Usuários criados: {result.get('users_created', 0)}")
            print(f"📊 Posts criados: {result.get('posts_created', 0)}")
            
            print("\n📧 Emails para login:")
            for user in result.get('users', []):
                print(f"  - {user['email']} ({user['fullName']})")
            
            print(f"\n🔐 Senha para todos: {result.get('login_info', {}).get('password', 'senha123')}")
        else:
            print(f"❌ Erro {response.status_code}: {response.text}")
    
    except requests.exceptions.ConnectionError:
        print("❌ Servidor não está rodando em http://localhost:8000")
    except Exception as e:
        print(f"❌ Erro: {e}")

if __name__ == "__main__":
    test_create_users()
