#!/usr/bin/env python3
"""
Script para instalação completa e setup do banco Azure MySQL
"""

import subprocess
import sys
import os
from pathlib import Path

def run_command(command, description):
    """Executa um comando e exibe o resultado"""
    print(f"\n{'='*50}")
    print(f"🔄 {description}")
    print(f"{'='*50}")
    
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print("✅ Comando executado com sucesso!")
        if result.stdout:
            print("📤 Saída:")
            print(result.stdout)
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Erro ao executar comando: {e}")
        if e.stdout:
            print("📤 Saída:")
            print(e.stdout)
        if e.stderr:
            print("🚨 Erro:")
            print(e.stderr)
        return False

def main():
    """Função principal para setup completo"""
    
    print("🚀 SETUP COMPLETO - VIBE SOCIAL + AZURE MYSQL")
    print("=" * 60)
    
    # Verificar se estamos no diretório correto
    if not os.path.exists("requirements.txt"):
        print("❌ Erro: Execute este script na pasta backend/")
        return False
    
    # 1. Instalar dependências
    if not run_command("pip install -r requirements.txt", "Instalando dependências Python"):
        print("❌ Falha na instalação das dependências")
        return False
    
    # 2. Testar conexão
    if not run_command("python test_connection.py", "Testando conexão com Azure MySQL"):
        print("❌ Falha no teste de conexão")
        print("💡 Verifique as configurações no arquivo .env")
        return False
    
    # 3. Configurar banco de dados
    if not run_command("python setup_azure_database.py", "Configurando banco de dados"):
        print("❌ Falha na configuração do banco")
        return False
    
    print("\n" + "="*60)
    print("🎉 SETUP CONCLUÍDO COM SUCESSO!")
    print("="*60)
    print("\n📝 Próximos passos:")
    print("1. Iniciar servidor: python main.py")
    print("2. Acessar aplicação: http://localhost:8000")
    print("3. Testar com usuário demo: demo@vibesocial.com / demo123")
    print("\n📚 Documentação: Leia AZURE_SETUP.md para mais detalhes")
    
    return True

if __name__ == "__main__":
    success = main()
    if not success:
        sys.exit(1)
