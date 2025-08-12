#!/usr/bin/env python3
"""
Script para testar a conexão com o banco de dados Azure MySQL
"""

import os
import pymysql
from dotenv import load_dotenv

def test_connection():
    """Testa a conexão com o banco Azure MySQL"""
    
    # Carregar variáveis de ambiente
    load_dotenv()
    
    DB_HOST = os.getenv("DB_HOST")
    DB_USER = os.getenv("DB_USER")
    DB_PASSWORD = os.getenv("DB_PASSWORD")
    DB_NAME = os.getenv("DB_NAME")
    DB_PORT = int(os.getenv("DB_PORT", 3306))
    
    print("🔧 Testando conexão com Azure MySQL...")
    print(f"📍 Host: {DB_HOST}")
    print(f"👤 Usuário: {DB_USER}")
    print(f"🗄️ Banco: {DB_NAME}")
    print(f"🔌 Porta: {DB_PORT}")
    print()
    
    try:
        # Teste de conexão básica
        connection = pymysql.connect(
            host=DB_HOST,
            user=DB_USER,
            password=DB_PASSWORD,
            port=DB_PORT,
            charset='utf8mb4',
            ssl_disabled=False
        )
        
        print("✅ Conexão estabelecida com sucesso!")
        
        # Executar queries de teste
        with connection.cursor() as cursor:
            # Verificar versão do MySQL
            cursor.execute("SELECT VERSION()")
            version = cursor.fetchone()
            print(f"🐬 Versão MySQL: {version[0]}")
            
            # Verificar se o banco existe
            cursor.execute("SHOW DATABASES")
            databases = [row[0] for row in cursor.fetchall()]
            print(f"📚 Bancos disponíveis: {', '.join(databases)}")
            
            if DB_NAME in databases:
                print(f"✅ Banco '{DB_NAME}' encontrado!")
                
                # Conectar ao banco específico
                cursor.execute(f"USE {DB_NAME}")
                
                # Listar tabelas
                cursor.execute("SHOW TABLES")
                tables = [row[0] for row in cursor.fetchall()]
                
                if tables:
                    print(f"📋 Tabelas no banco '{DB_NAME}': {', '.join(tables)}")
                else:
                    print(f"ℹ️ Banco '{DB_NAME}' está vazio (sem tabelas)")
            else:
                print(f"⚠️ Banco '{DB_NAME}' não encontrado!")
        
        connection.close()
        print("\n🎉 Teste de conexão concluído com sucesso!")
        return True
        
    except pymysql.Error as e:
        print(f"❌ Erro de conexão: {e}")
        print("\n💡 Dicas de troubleshooting:")
        print("1. Verifique se as credenciais estão corretas no .env")
        print("2. Confirme se o servidor Azure MySQL está ativo")
        print("3. Verifique as regras de firewall do Azure")
        print("4. Confirme se o SSL está configurado corretamente")
        return False
    
    except Exception as e:
        print(f"❌ Erro inesperado: {e}")
        return False

if __name__ == "__main__":
    test_connection()
