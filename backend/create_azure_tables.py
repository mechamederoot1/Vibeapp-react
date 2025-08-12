#!/usr/bin/env python3
"""
Script SUPER SIMPLES para criar tabelas no Azure MySQL
Configurações diretas - sem dependência de arquivos externos
"""

import sys
import os
from pathlib import Path

# Adicionar diretório atual ao path
sys.path.insert(0, str(Path(__file__).parent))

print("🚀 Criando tabelas no Azure MySQL...")

# CONFIGURAÇÕES DIRETAS DO AZURE
DB_HOST = "evoque-database.mysql.database.azure.com"
DB_USER = "infra"
DB_PASSWORD = "Evoque12@"
DB_NAME = "testes"
DB_PORT = 3306

print(f"📍 Host: {DB_HOST}")
print(f"👤 User: {DB_USER}")
print(f"🗄️ Database: {DB_NAME}")

# 1. Importar dependências
try:
    import pymysql
    from sqlalchemy import create_engine, text
    print("✅ Dependências OK")
except ImportError as e:
    print(f"❌ Faltando: {e}")
    print("💡 Execute: pip install PyMySQL sqlalchemy")
    sys.exit(1)

# 2. Testar conexão
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
    print("💡 Verifique se:")
    print("   - O servidor Azure está ativo")
    print("   - As credenciais estão corretas")
    print("   - O firewall permite conexões")
    sys.exit(1)

# 3. Criar banco
try:
    print(f"\n📦 Criando banco '{DB_NAME}'...")
    
    connection = pymysql.connect(
        host=DB_HOST,
        user=DB_USER,
        password=DB_PASSWORD,
        port=DB_PORT,
        charset='utf8mb4'
    )
    
    with connection.cursor() as cursor:
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{DB_NAME}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
    
    connection.close()
    print(f"✅ Banco '{DB_NAME}' criado!")
    
except Exception as e:
    print(f"❌ Erro ao criar banco: {e}")
    sys.exit(1)

# 4. Importar modelos
try:
    print("\n📋 Importando modelos...")
    
    from app.database.database import Base
    from app.models.user import User
    from app.models.account_settings import AccountSettings
    from app.models.post import Post, PostLike, Comment, Share
    from app.models.reaction import PostReaction, CommentReaction
    from app.models.story import Story, StoryView
    from app.models.friendship import Friendship
    from app.models.profile_view import ProfileView
    from app.models.notification import Notification
    
    print("✅ Modelos importados!")
    
    tabelas = list(Base.metadata.tables.keys())
    print(f"📊 {len(tabelas)} tabelas para criar:")
    for i, tabela in enumerate(sorted(tabelas), 1):
        print(f"   {i:2d}. {tabela}")
    
except Exception as e:
    print(f"❌ Erro ao importar: {e}")
    print("💡 Verifique se você está na pasta backend/")
    sys.exit(1)

# 5. Criar engine
try:
    print(f"\n🔧 Configurando engine...")
    
    DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}?charset=utf8mb4"
    
    engine = create_engine(
        DATABASE_URL,
        echo=False,
        pool_pre_ping=True
    )
    
    print("✅ Engine configurado!")
    
except Exception as e:
    print(f"❌ Erro no engine: {e}")
    sys.exit(1)

# 6. CRIAR TABELAS!
try:
    print(f"\n🏗️ CRIANDO {len(tabelas)} TABELAS NO AZURE...")
    
    Base.metadata.create_all(bind=engine)
    
    print("✅ Comando executado!")
    
except Exception as e:
    print(f"❌ Erro ao criar tabelas: {e}")
    sys.exit(1)

# 7. Verificar resultado
try:
    print(f"\n🔍 Verificando...")
    
    with engine.connect() as conn:
        result = conn.execute(text("SHOW TABLES"))
        tabelas_criadas = [row[0] for row in result.fetchall()]
    
    if tabelas_criadas:
        print(f"🎉 SUCCESS! {len(tabelas_criadas)} tabelas criadas:")
        for i, tabela in enumerate(sorted(tabelas_criadas), 1):
            print(f"   ✓ {i:2d}. {tabela}")
        
        print(f"\n🎊 MIGRAÇÃO CONCLUÍDA!")
        print(f"🌐 Banco: {DB_HOST}/{DB_NAME}")
        print(f"📊 Tabelas: {len(tabelas_criadas)}")
        
    else:
        print("❌ Nenhuma tabela encontrada!")
        sys.exit(1)
    
except Exception as e:
    print(f"❌ Erro na verificação: {e}")
    sys.exit(1)

print(f"\n🚀 Agora você pode usar o Azure MySQL!")
print(f"💡 Para testar: python main.py")
