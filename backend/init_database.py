#!/usr/bin/env python3
"""
Script para inicializar banco SQLite com todas as tabelas da aplicação
"""

import sys
import os
from pathlib import Path

# Adicionar diretório atual ao path
sys.path.insert(0, str(Path(__file__).parent))

print("🚀 Inicializando banco SQLite...")

# 1. Importar base e modelos
try:
    from app.database.database import Base, engine
    
    # Importar todos os modelos para que sejam registrados
    from app.models.user import User
    from app.models.account_settings import AccountSettings
    from app.models.post import Post, PostLike, Comment, Share
    from app.models.reaction import PostReaction, CommentReaction
    from app.models.story import Story, StoryView
    from app.models.friendship import Friendship
    from app.models.profile_view import ProfileView
    from app.models.notification import Notification
    from app.models.work_experience import WorkExperience
    from app.models.education import Education

    print("✅ Modelos importados!")
    
    # Listar tabelas que serão criadas
    tabelas = list(Base.metadata.tables.keys())
    print(f"📊 {len(tabelas)} tabelas para criar:")
    for i, tabela in enumerate(sorted(tabelas), 1):
        print(f"   {i:2d}. {tabela}")
    
except Exception as e:
    print(f"❌ Erro ao importar: {e}")
    sys.exit(1)

# 2. Criar todas as tabelas
try:
    print(f"\n🏗️ Criando tabelas no SQLite...")
    
    # Comando mágico do SQLAlchemy - cria todas as tabelas
    Base.metadata.create_all(bind=engine)
    
    print("✅ Tabelas criadas!")
    
except Exception as e:
    print(f"❌ Erro ao criar tabelas: {e}")
    sys.exit(1)

# 3. Verificar se deu certo
try:
    from sqlalchemy import text
    
    print(f"\n🔍 Verificando tabelas criadas...")
    
    with engine.connect() as conn:
        # SQLite usa uma sintaxe diferente para listar tabelas
        result = conn.execute(text("SELECT name FROM sqlite_master WHERE type='table'"))
        tabelas_criadas = [row[0] for row in result.fetchall()]
    
    if tabelas_criadas:
        print(f"🎉 SUCCESS! {len(tabelas_criadas)} tabelas criadas:")
        for i, tabela in enumerate(sorted(tabelas_criadas), 1):
            print(f"   ✓ {i:2d}. {tabela}")
        
        print(f"\n🎊 BANCO SQLite PRONTO!")
        print(f"📍 Arquivo: ./vibe_social.db")
        print(f"📊 Tabelas: {len(tabelas_criadas)}")
        
    else:
        print("❌ Nenhuma tabela encontrada!")
        sys.exit(1)
    
except Exception as e:
    print(f"❌ Erro na verificação: {e}")
    sys.exit(1)

print(f"\n🚀 Agora você pode usar a aplicação!")
print(f"💡 Para iniciar: python main.py")
