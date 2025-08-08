#!/usr/bin/env python3
"""
Script para testar o backend rapidamente
"""
import requests
import json

def test_backend():
    """Testar se o backend está funcionando"""
    base_url = "http://localhost:8000"
    
    tests = [
        ("Health Check", f"{base_url}/health"),
        ("API Health", f"{base_url}/api/health"),
        ("Stories (Public)", f"{base_url}/api/stories"),
        ("Migration", f"{base_url}/api/dev/migrate-database"),
    ]
    
    print("🧪 Testando Backend...")
    print("=" * 50)
    
    for test_name, url in tests:
        try:
            if "migrate-database" in url:
                response = requests.post(url, timeout=10)
            else:
                response = requests.get(url, timeout=5)
            
            if response.status_code < 400:
                print(f"✅ {test_name}: OK ({response.status_code})")
                if response.status_code == 200:
                    try:
                        data = response.json()
                        if 'error' in data:
                            print(f"   ⚠️  {data['error']}")
                        elif 'message' in data:
                            print(f"   📝 {data['message']}")
                    except:
                        pass
            else:
                print(f"❌ {test_name}: Erro {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   📝 {error_data.get('detail', 'Erro desconhecido')}")
                except:
                    print(f"   📝 {response.text[:100]}")
        
        except requests.exceptions.ConnectionError:
            print(f"🔌 {test_name}: Backend offline")
        except requests.exceptions.Timeout:
            print(f"⏰ {test_name}: Timeout")
        except Exception as e:
            print(f"❌ {test_name}: {e}")
    
    print("\n" + "=" * 50)
    print("💡 Se há erros, verifique:")
    print("   1. Backend está rodando: python3 start_backend.py")
    print("   2. Porta 8000 disponível")
    print("   3. Dependências instaladas: pip3 install -r backend/requirements.txt")

if __name__ == "__main__":
    test_backend()
