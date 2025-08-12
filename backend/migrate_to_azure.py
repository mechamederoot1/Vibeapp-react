#!/usr/bin/env python3
"""
Script para migrar do SQLite para Azure MySQL
Cria todas as tabelas da aplicação no banco Azure
"""

import sys
import os
from pathlib import Path

# Adicionar diretório atual ao path
sys.path.insert(0, str(Path(__file__).parent))

print("🚀 Migrando do SQLite para Azure MySQL...")

# 1. Carregar configurações (múltiplas fontes)
DB_HOST = None
DB_USER = None
DB_PASSWORD = None
DB_NAME = None
DB_PORT = None

# Tentar carregar do env.py primeiro
try:
    import env
    DB_HOST = env.DB_HOST
    DB_USER = env.DB_USER
    DB_PASSWORD = env.DB_PASSWORD
    DB_NAME = env.DB_NAME
    DB_PORT = int(env.DB_PORT)
    print("✅ Configurações carregadas do env.py")
except ImportError:
    print("📄 env.py não encontrado, tentando .env...")

    # Tentar carregar do .env
    try:
        from dotenv import load_dotenv
        load_dotenv()

        DB_HOST = os.getenv("DB_HOST")
        DB_USER = os.getenv("DB_USER")
        DB_PASSWORD = os.getenv("DB_PASSWORD")
        DB_NAME = os.getenv("DB_NAME")
        DB_PORT = int(os.getenv("DB_PORT", 3306))
        print("✅ Configurações carregadas do .env")
    except:
        print("📄 .env não encontrado, usando valores diretos...")

        # Valores diretos das configurações Azure
        DB_HOST = "evoque-database.mysql.database.azure.com"
        DB_USER = "infra"
        DB_PASSWORD = "Evoque12@"
        DB_NAME = "testes"
        DB_PORT = 3306
        print("✅ Usando configurações diretas do Azure")

# Verificar se temos todas as configurações
if not all([DB_HOST, DB_USER, DB_PASSWORD, DB_NAME]):
    print("❌ Configurações incompletas!")
    print(f"   DB_HOST: {DB_HOST or 'FALTANDO'}")
    print(f"   DB_USER: {DB_USER or 'FALTANDO'}")
    print(f"   DB_PASSWORD: {'***' if DB_PASSWORD else 'FALTANDO'}")
    print(f"   DB_NAME: {DB_NAME or 'FALTANDO'}")
    sys.exit(1)

print(f"📍 Conectando em: {DB_HOST}:{DB_PORT}")
print(f"🗄️ Banco: {DB_NAME}")
print(f"👤 Usuário: {DB_USER}")

# 2. Importar dependências
try:
    import pymysql
    from sqlalchemy import create_engine, text
    print("✅ Dependências importadas")
except ImportError as e:
    print(f"❌ Dependência faltando: {e}")
    print("Execute: pip install PyMySQL sqlalchemy python-dotenv")
    sys.exit(1)

# 3. Testar conexão
try:
    print("\n🔗 Testando conexão...")
    
    connection = pymysql.connect(
        host=DB_HOST,
        user=DB_USER,
        password=DB_PASSWORD,
        port=DB_PORT,
        charset='utf8mb4'
    )
    
    print("✅ Conexão OK!")
    connection.close()
    
except Exception as e:
    print(f"❌ Erro de conexão: {e}")
    sys.exit(1)

# 4. Criar banco se não existir
try:
    print(f"\n📦 Preparando banco '{DB_NAME}'...")
    
    connection = pymysql.connect(
        host=DB_HOST,
        user=DB_USER,
        password=DB_PASSWORD,
        port=DB_PORT,
        charset='utf8mb4'
    )
    
    with connection.cursor() as cursor:
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{DB_NAME}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
        print(f"✅ Banco '{DB_NAME}' pronto!")
    
    connection.close()
    
except Exception as e:
    print(f"❌ Erro ao criar banco: {e}")
    sys.exit(1)

# 5. Importar TODOS os modelos da aplicação
try:
    print("\n📋 Importando modelos da aplicação...")
    
    # Base do SQLAlchemy
    from app.database.database import Base
    
    # Todos os modelos existentes
    from app.models.user import User
    from app.models.account_settings import AccountSettings
    from app.models.post import Post, PostLike, Comment, Share
    from app.models.reaction import PostReaction, CommentReaction
    from app.models.story import Story, StoryView
    from app.models.friendship import Friendship
    from app.models.profile_view import ProfileView
    from app.models.notification import Notification
    
    print("✅ Todos os modelos importados!")
    
    # Listar tabelas que serão criadas
    print("\n📊 Tabelas da aplicação:")
    for table_name in sorted(Base.metadata.tables.keys()):
        print(f"   • {table_name}")
    
except Exception as e:
    print(f"❌ Erro ao importar modelos: {e}")
    sys.exit(1)

# 6. Criar engine do Azure MySQL
try:
    print("\n🔧 Configurando engine do Azure...")
    
    DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}?charset=utf8mb4"
    
    engine = create_engine(
        DATABASE_URL,
        echo=False,  # Mude para True se quiser ver o SQL
        pool_pre_ping=True,
        pool_recycle=300
    )
    
    print("✅ Engine configurado!")
    
except Exception as e:
    print(f"❌ Erro ao configurar engine: {e}")
    sys.exit(1)

# 7. CRIAR TODAS AS TABELAS NO AZURE
try:
    print("\n🏗️ Criando tabelas no Azure MySQL...")
    
    # Comando mágico que cria todas as tabelas
    Base.metadata.create_all(bind=engine)
    
    print("✅ Tabelas criadas!")
    
except Exception as e:
    print(f"❌ Erro ao criar tabelas: {e}")
    sys.exit(1)

# 8. Verificar se deu certo
try:
    print("\n✅ Verificando tabelas criadas...")
    
    with engine.connect() as conn:
        result = conn.execute(text("SHOW TABLES"))
        tables = [row[0] for row in result.fetchall()]
        
        print(f"🎉 {len(tables)} tabelas criadas no Azure:")
        for table in sorted(tables):
            print(f"   ✓ {table}")
    
    print(f"\n🎊 MIGRAÇÃO CONCLUÍDA COM SUCESSO!")
    print(f"📍 Banco: {DB_HOST}/{DB_NAME}")
    print(f"📊 {len(tables)} tabelas criadas")
    print(f"\n💡 Agora você pode:")
    print(f"   1. Iniciar o backend: python main.py")
    print(f"   2. Testar a API: http://localhost:8000")
    
except Exception as e:
    print(f"❌ Erro na verificação: {e}")
    sys.exit(1)
