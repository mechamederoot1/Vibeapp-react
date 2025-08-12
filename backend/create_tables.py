#!/usr/bin/env python3
"""
Script simplificado para criar tabelas no banco Azure MySQL
"""

import os
import sys
from pathlib import Path

# Adicionar o diretório atual ao Python path
current_dir = Path(__file__).parent
sys.path.insert(0, str(current_dir))

print("🔧 Iniciando criação de tabelas...")

try:
    # Tentar importar as dependências
    import pymysql
    print("✅ PyMySQL importado")
    
    from sqlalchemy import create_engine, text
    print("✅ SQLAlchemy importado")
    
    from dotenv import load_dotenv
    print("✅ python-dotenv importado")
    
except ImportError as e:
    print(f"❌ Erro de importação: {e}")
    print("💡 Execute: pip install PyMySQL sqlalchemy python-dotenv")
    sys.exit(1)

# Carregar variáveis de ambiente
load_dotenv()

# Tentar importar configurações do env.py como fallback
try:
    import env as env_config
    print("📁 Usando configurações do env.py")
    
    DB_HOST = env_config.DB_HOST
    DB_USER = env_config.DB_USER
    DB_PASSWORD = env_config.DB_PASSWORD
    DB_NAME = env_config.DB_NAME
    DB_PORT = int(env_config.DB_PORT)
    
except ImportError:
    print("📁 Usando variáveis de ambiente")
    
    DB_HOST = os.getenv("DB_HOST")
    DB_USER = os.getenv("DB_USER")
    DB_PASSWORD = os.getenv("DB_PASSWORD")
    DB_NAME = os.getenv("DB_NAME")
    DB_PORT = int(os.getenv("DB_PORT", 3306))

print(f"\n🔗 Configurações:")
print(f"   Host: {DB_HOST}")
print(f"   User: {DB_USER}")
print(f"   Database: {DB_NAME}")
print(f"   Port: {DB_PORT}")

if not all([DB_HOST, DB_USER, DB_PASSWORD, DB_NAME]):
    print("\n❌ Erro: Configurações incompletas!")
    print("Verifique se todas as variáveis estão definidas:")
    print(f"   DB_HOST: {'✅' if DB_HOST else '❌'}")
    print(f"   DB_USER: {'✅' if DB_USER else '❌'}")
    print(f"   DB_PASSWORD: {'✅' if DB_PASSWORD else '❌'}")
    print(f"   DB_NAME: {'✅' if DB_NAME else '❌'}")
    sys.exit(1)

try:
    # 1. Teste de conexão básica
    print("\n1️⃣ Testando conexão...")
    
    connection = pymysql.connect(
        host=DB_HOST,
        user=DB_USER,
        password=DB_PASSWORD,
        port=DB_PORT,
        charset='utf8mb4'
    )
    
    with connection.cursor() as cursor:
        cursor.execute("SELECT VERSION()")
        version = cursor.fetchone()
        print(f"✅ MySQL conectado! Versão: {version[0]}")
    
    connection.close()
    
    # 2. Criar/verificar banco de dados
    print(f"\n2️⃣ Verificando banco '{DB_NAME}'...")
    
    connection = pymysql.connect(
        host=DB_HOST,
        user=DB_USER,
        password=DB_PASSWORD,
        port=DB_PORT,
        charset='utf8mb4'
    )
    
    with connection.cursor() as cursor:
        # Criar banco se não existir
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{DB_NAME}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
        print(f"✅ Banco '{DB_NAME}' criado/verificado")
        
        # Verificar se o banco existe
        cursor.execute("SHOW DATABASES")
        databases = [row[0] for row in cursor.fetchall()]
        
        if DB_NAME in databases:
            print(f"✅ Banco '{DB_NAME}' confirmado na lista")
        else:
            print(f"❌ Banco '{DB_NAME}' não encontrado!")
            sys.exit(1)
    
    connection.close()
    
    # 3. Importar modelos e criar tabelas
    print("\n3️⃣ Importando modelos...")
    
    try:
        # Importar base do banco
        from app.database.database import Base
        print("✅ Base importada")
        
        # Importar todos os modelos
        from app.models.user import User
        from app.models.account_settings import AccountSettings
        from app.models.post import Post, PostLike, Comment, Share
        from app.models.reaction import PostReaction, CommentReaction
        from app.models.story import Story, StoryView
        from app.models.friendship import Friendship
        from app.models.profile_view import ProfileView
        from app.models.notification import Notification
        
        print("✅ Todos os modelos importados")
        
        # Listar tabelas que serão criadas
        print("\n📋 Tabelas a serem criadas:")
        for table_name, table in Base.metadata.tables.items():
            print(f"   🔹 {table_name}")
        
    except ImportError as e:
        print(f"❌ Erro ao importar modelos: {e}")
        sys.exit(1)
    
    # 4. Criar engine e tabelas
    print("\n4️⃣ Criando tabelas...")
    
    DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}?charset=utf8mb4"
    
    engine = create_engine(
        DATABASE_URL,
        echo=False,  # Mudar para True se quiser ver o SQL
        pool_pre_ping=True,
        pool_recycle=300
    )
    
    # Criar todas as tabelas
    Base.metadata.create_all(bind=engine)
    print("✅ Comando create_all executado")
    
    # 5. Verificar tabelas criadas
    print("\n5️⃣ Verificando tabelas criadas...")
    
    with engine.connect() as conn:
        result = conn.execute(text("SHOW TABLES"))
        tables = [row[0] for row in result.fetchall()]
        
        if tables:
            print(f"✅ {len(tables)} tabelas encontradas:")
            for table in sorted(tables):
                print(f"   📄 {table}")
        else:
            print("❌ Nenhuma tabela encontrada!")
            sys.exit(1)
    
    # 6. Verificar estrutura de tabelas importantes
    print("\n6️⃣ Verificando estrutura das tabelas...")
    
    important_tables = ['users', 'account_settings', 'posts']
    
    with engine.connect() as conn:
        for table in important_tables:
            if table in tables:
                print(f"\n📋 Estrutura da tabela '{table}':")
                result = conn.execute(text(f"DESCRIBE {table}"))
                columns = result.fetchall()
                
                for col in columns:
                    nullable = "NULL" if col[2] == "YES" else "NOT NULL"
                    default = f"DEFAULT {col[4]}" if col[4] else ""
                    print(f"   🔹 {col[0]:20} {col[1]:15} {nullable:8} {default}")
            else:
                print(f"⚠️  Tabela '{table}' não encontrada")
    
    print("\n🎉 Setup concluído com sucesso!")
    print("\n📝 Próximos passos:")
    print("1. Iniciar o backend: python main.py")
    print("2. Testar a API em: http://localhost:8000")
    print("3. Ver documentação: http://localhost:8000/docs")
    
except pymysql.Error as e:
    print(f"\n❌ Erro MySQL: {e}")
    print("\n💡 Possíveis soluções:")
    print("1. Verificar credenciais no .env ou env.py")
    print("2. Confirmar se o servidor Azure está ativo")
    print("3. Verificar regras de firewall")
    sys.exit(1)
    
except Exception as e:
    print(f"\n❌ Erro inesperado: {e}")
    print(f"Tipo do erro: {type(e).__name__}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
