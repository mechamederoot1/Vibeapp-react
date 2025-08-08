#!/usr/bin/env python3
"""
Script para iniciar o backend independentemente
"""
import os
import sys
import subprocess

def start_backend():
    """Iniciar o servidor backend"""
    backend_dir = os.path.join(os.path.dirname(__file__), 'backend')
    
    if not os.path.exists(backend_dir):
        print("❌ Diretório backend não encontrado")
        return
    
    os.chdir(backend_dir)
    
    print("🚀 Iniciando servidor backend...")
    print("📍 Diretório:", os.getcwd())
    print("🔗 URL: http://localhost:8000")
    print("📚 Docs: http://localhost:8000/docs")
    print("-" * 50)
    
    try:
        # Tentar python3 primeiro, depois python
        try:
            subprocess.run([sys.executable, "main.py"], check=True)
        except FileNotFoundError:
            subprocess.run(["python3", "main.py"], check=True)
    except subprocess.CalledProcessError as e:
        print(f"❌ Erro ao iniciar backend: {e}")
    except KeyboardInterrupt:
        print("\n👋 Backend encerrado pelo usuário")

if __name__ == "__main__":
    start_backend()
