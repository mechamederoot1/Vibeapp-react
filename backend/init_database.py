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
    # posts
    from app.models.post import Post, PostLike, Comment, Share
    from app.models.reaction import PostReaction, CommentReaction
    # stories
    from app.models.story import Story, StoryView
    # friendships
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
    print(f"❌ Erro ao importar modelos: {e}")
    sys.exit(1)

# 2. Ajustar PRAGMAs do SQLite para maior robustez
try:
    from sqlalchemy import text
    with engine.connect() as conn:
        # Habilita foreign keys e journal WAL para melhor concorrência
        try:
            conn.execute(text("PRAGMA foreign_keys = ON"))
            conn.execute(text("PRAGMA journal_mode = WAL"))
            conn.execute(text("PRAGMA synchronous = NORMAL"))
            print("🔧 PRAGMAs aplicados: foreign_keys=ON, journal_mode=WAL, synchronous=NORMAL")
        except Exception as e:
            print(f"⚠️ Não foi possível aplicar PRAGMAs: {e}")
except Exception as e:
    print(f"⚠️ Erro ao conectar para aplicar PRAGMAs: {e}")

# 3. Criar todas as tabelas
try:
    print(f"\n🏗️ Criando/atualizando tabelas no banco (create_all)...")
    Base.metadata.create_all(bind=engine)
    print("✅ Base.metadata.create_all executado")

    # Criar índices úteis para melhorar consultas comuns
    with engine.connect() as conn:
        try:
            conn.execute(text("CREATE INDEX IF NOT EXISTS idx_friendships_user_id ON friendships(user_id)"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS idx_friendships_friend_id ON friendships(friend_id)"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS idx_friendships_status ON friendships(status)"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)"))
            print("🔎 Índices criados (se não existiam)")
        except Exception as e:
            print(f"⚠️ Falha ao criar índices: {e}")

except Exception as e:
    print(f"❌ Erro ao criar tabelas: {e}")
    sys.exit(1)

# 4. Validar esquema crítico para evitar erros em runtime
required_tables = {
    'friendships': ['id', 'user_id', 'friend_id', 'status', 'initiated_by', 'created_at'],
    'users': ['id', 'username', 'email'],
    'notifications': ['id', 'user_id', 'type']
}

try:
    print(f"\n🔍 Validando esquema das tabelas críticas...")
    with engine.connect() as conn:
        for table, cols in required_tables.items():
            try:
                result = conn.execute(text(f"PRAGMA table_info('{table}')"))
                existing = [row[1] for row in result.fetchall()]
                missing = [c for c in cols if c not in existing]
                if missing:
                    print(f"❌ Tabela '{table}' está faltando colunas críticas: {missing}")
                else:
                    print(f"✓ Tabela '{table}' ok ({len(existing)} colunas)")
            except Exception as e:
                print(f"❌ Erro ao verificar tabela '{table}': {e}")

except Exception as e:
    print(f"❌ Erro na verificação do esquema: {e}")
    sys.exit(1)

# 5. (Opcional) Seed mínimo para facilitar testes locais
try:
    from sqlalchemy.orm import Session
    from app.database.database import SessionLocal
    session = SessionLocal()
    try:
        ucount = session.query(User).count()
        if ucount == 0:
            print("✨ Sem usuários detectados — criando user de teste 'tester@example.com'")
            usr = User(email='tester@example.com', first_name='Test', last_name='User')
            usr.set_password('password')
            session.add(usr)
            session.commit()
            print(f"🆕 Usuário criado com id={usr.id}")
        else:
            print(f"ℹ️ Usuários existentes: {ucount}")
    except Exception as e:
        print(f"⚠️ Falha ao verificar/seed usuários: {e}")
    finally:
        try: session.close()
        except: pass
except Exception as e:
    print(f"⚠️ Salt (seed) de usuários não executado: {e}")

# 6. Listar tabelas criadas
try:
    with engine.connect() as conn:
        result = conn.execute(text("SELECT name FROM sqlite_master WHERE type='table'"))
        tabelas_criadas = [row[0] for row in result.fetchall()]
    if tabelas_criadas:
        print(f"\n🎉 Tabelas no banco ({len(tabelas_criadas)}):")
        for i, tabela in enumerate(sorted(tabelas_criadas), 1):
            print(f"   ✓ {i:2d}. {tabela}")
    else:
        print("❌ Nenhuma tabela encontrada após criação!")

except Exception as e:
    print(f"❌ Erro ao listar tabelas: {e}")
    sys.exit(1)

print(f"\n🚀 Inicialização concluída. Arquivo DB: (verifique sua configuração de engine)")
print(f"💡 Para iniciar: python main.py")
