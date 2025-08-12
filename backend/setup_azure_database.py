#!/usr/bin/env python3
"""
Script para configurar o banco de dados Azure MySQL
Cria todas as tabelas e estruturas necessárias para a aplicação Vibe Social
"""

import sys
import os
from pathlib import Path

# Adicionar o diretório raiz ao Python path
sys.path.append(str(Path(__file__).parent))

import pymysql
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError
from dotenv import load_dotenv

# Importar todos os modelos para garantir que sejam registrados
from app.models import (
    User, Post, PostLike, Comment, Share,
    PostReaction, CommentReaction, Notification,
    Friendship, ProfileView, AccountSettings
)
from app.database.database import Base

def main():
    """Função principal para configurar o banco de dados"""
    
    # Carregar variáveis de ambiente
    load_dotenv()
    
    # Configurações do banco
    DB_HOST = os.getenv("DB_HOST")
    DB_USER = os.getenv("DB_USER")
    DB_PASSWORD = os.getenv("DB_PASSWORD")
    DB_NAME = os.getenv("DB_NAME")
    DB_PORT = int(os.getenv("DB_PORT", 3306))
    
    if not all([DB_HOST, DB_USER, DB_PASSWORD, DB_NAME]):
        print("❌ Erro: Configurações do banco de dados não encontradas no .env")
        print("Verifique se as seguintes variáveis estão definidas:")
        print("- DB_HOST")
        print("- DB_USER") 
        print("- DB_PASSWORD")
        print("- DB_NAME")
        return False
    
    print("🚀 Iniciando configuração do banco de dados Azure MySQL...")
    print(f"📍 Host: {DB_HOST}")
    print(f"👤 Usuário: {DB_USER}")
    print(f"🗄️ Banco: {DB_NAME}")
    print(f"🔌 Porta: {DB_PORT}")
    print()
    
    try:
        # 1. Testar conexão básica com MySQL
        print("1️⃣ Testando conexão com MySQL...")
        connection = pymysql.connect(
            host=DB_HOST,
            user=DB_USER,
            password=DB_PASSWORD,
            port=DB_PORT,
            charset='utf8mb4',
            ssl_disabled=False
        )
        
        with connection.cursor() as cursor:
            cursor.execute("SELECT VERSION()")
            version = cursor.fetchone()
            print(f"✅ Conexão estabelecida! Versão MySQL: {version[0]}")
        
        connection.close()
        
        # 2. Criar banco de dados se não existir
        print(f"\n2️⃣ Verificando banco de dados '{DB_NAME}'...")
        connection = pymysql.connect(
            host=DB_HOST,
            user=DB_USER,
            password=DB_PASSWORD,
            port=DB_PORT,
            charset='utf8mb4',
            ssl_disabled=False
        )
        
        with connection.cursor() as cursor:
            cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{DB_NAME}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
            cursor.execute(f"USE `{DB_NAME}`")
            print(f"✅ Banco de dados '{DB_NAME}' pronto!")
        
        connection.close()
        
        # 3. Criar engine SQLAlchemy e tabelas
        print("\n3️⃣ Criando tabelas com SQLAlchemy...")
        DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}?charset=utf8mb4"
        
        engine = create_engine(
            DATABASE_URL,
            echo=True,  # Mostrar SQL gerado
            pool_pre_ping=True,
            pool_recycle=300,
            connect_args={
                "charset": "utf8mb4",
                "autocommit": False
            }
        )
        
        # Criar todas as tabelas
        print("📋 Criando estrutura das tabelas...")
        Base.metadata.create_all(bind=engine)
        
        # 4. Verificar tabelas criadas
        print("\n4️⃣ Verificando tabelas criadas...")
        with engine.connect() as conn:
            result = conn.execute(text("SHOW TABLES"))
            tables = [row[0] for row in result]
            
            if tables:
                print("✅ Tabelas criadas com sucesso:")
                for table in sorted(tables):
                    print(f"   📄 {table}")
            else:
                print("⚠️ Nenhuma tabela encontrada")
                return False
        
        # 5. Verificar estrutura de algumas tabelas importantes
        print("\n5️⃣ Verificando estrutura das tabelas...")
        important_tables = ['users', 'posts', 'account_settings', 'friendships']
        
        with engine.connect() as conn:
            for table in important_tables:
                if table in tables:
                    result = conn.execute(text(f"DESCRIBE {table}"))
                    columns = result.fetchall()
                    print(f"\n📋 Estrutura da tabela '{table}':")
                    for col in columns:
                        print(f"   🔹 {col[0]} - {col[1]} - {col[2]} - {col[3]}")
        
        # 6. Teste de inserção básica
        print("\n6️⃣ Testando operações básicas...")
        with engine.connect() as conn:
            # Verificar se já existe algum usuário
            result = conn.execute(text("SELECT COUNT(*) FROM users"))
            user_count = result.fetchone()[0]
            print(f"📊 Usuários existentes: {user_count}")
        
        print("\n🎉 Configuração do banco de dados Azure MySQL concluída com sucesso!")
        print("\n📝 Próximos passos:")
        print("1. Instalar dependências: pip install -r requirements.txt")
        print("2. Iniciar o servidor: python main.py")
        print("3. Acessar a aplicação em: http://localhost:8000")
        
        return True
        
    except pymysql.Error as e:
        print(f"❌ Erro de conexão MySQL: {e}")
        return False
    except SQLAlchemyError as e:
        print(f"❌ Erro SQLAlchemy: {e}")
        return False
    except Exception as e:
        print(f"❌ Erro inesperado: {e}")
        return False

def create_demo_data():
    """Criar dados de demonstração (opcional)"""
    
    print("\n🎭 Criando dados de demonstração...")
    
    from app.database.database import SessionLocal
    from app.models.user import User
    from datetime import datetime
    
    db = SessionLocal()
    
    try:
        # Verificar se já existe o usuário demo
        existing_user = db.query(User).filter(User.email == "demo@vibesocial.com").first()
        if existing_user:
            print("ℹ️ Usuário demo já existe")
            return
        
        # Criar usuário demo
        demo_user = User(
            email="demo@vibesocial.com",
            first_name="Demo",
            last_name="User",
            username="demo.user",
            bio="Usuário de demonstração do Vibe Social 🚀",
            location="São Paulo, Brasil",
            is_verified=True,
            created_at=datetime.utcnow()
        )
        demo_user.set_password("demo123")
        
        db.add(demo_user)
        db.commit()
        db.refresh(demo_user)
        
        print("✅ Usuário demo criado:")
        print(f"   📧 Email: demo@vibesocial.com")
        print(f"   🔐 Senha: demo123")
        
    except Exception as e:
        print(f"❌ Erro ao criar dados demo: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    success = main()
    
    if success:
        # Perguntar se quer criar dados demo
        create_demo = input("\n❓ Deseja criar dados de demonstração? (s/n): ").lower().strip()
        if create_demo in ['s', 'sim', 'y', 'yes']:
            create_demo_data()
    
    print("\n" + "="*50)
    if success:
        print("✅ SETUP CONCLUÍDO COM SUCESSO!")
    else:
        print("❌ SETUP FALHOU!")
        sys.exit(1)
