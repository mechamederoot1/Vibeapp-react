#!/usr/bin/env python3
import requests
import json

# URL da API
API_URL = "http://localhost:8000/api"

def create_test_users():
    """Criar usuários teste via API"""
    try:
        response = requests.post(f"{API_URL}/dev/create-test-users")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Usuários teste criados com sucesso!")
            print(f"Usuários criados: {result['users_created']}")
            print(f"Posts criados: {result['posts_created']}")
            print("\n📧 Para fazer login, use:")
            print("Senha: senha123")
            print("\nEmails disponíveis:")
            for user in result['users']:
                print(f"  - {user['email']} ({user['fullName']})")
        else:
            print(f"❌ Erro: {response.status_code}")
            print(response.text)
    
    except requests.exceptions.ConnectionError:
        print("❌ Erro: Não foi possível conectar ao servidor.")
        print("Certifique-se de que o servidor backend está rodando em http://localhost:8000")
    except Exception as e:
        print(f"❌ Erro inesperado: {e}")

if __name__ == "__main__":
    print("🚀 Criando usuários teste...")
    create_test_users()
