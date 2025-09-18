"""
Migração para adicionar um ID público único de perfil aos usuários
- Adiciona coluna public_profile_id na tabela users (se não existir)
- Popula valores únicos para usuários existentes
- Cria índice único para garantir unicidade
Compatível com SQLite
"""

import sys
import os
import random
import string
from sqlalchemy import text

# Garantir que o app esteja no PYTHONPATH
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from app.database.database import SessionLocal


def column_exists_sqlite(db, table_name: str, column_name: str) -> bool:
    result = db.execute(text(f"PRAGMA table_info({table_name})"))
    for row in result.fetchall():
        # PRAGMA table_info retorna: cid, name, type, notnull, dflt_value, pk
        if row[1] == column_name:
            return True
    return False


def generate_numeric_id(n=10) -> str:
    return ''.join(random.SystemRandom().choice(string.digits) for _ in range(n))


def migrate():
    from sqlalchemy.exc import IntegrityError
    db = SessionLocal()
    try:
        if not column_exists_sqlite(db, 'users', 'public_profile_id'):
            print("🔄 Adicionando coluna 'public_profile_id' na tabela users...")
            db.execute(text("ALTER TABLE users ADD COLUMN public_profile_id TEXT"))
            db.commit()
        else:
            print("✅ Coluna 'public_profile_id' já existe")

        # Criar índice único se não existir
        print("🔄 Criando índice único em public_profile_id (se não existir)...")
        db.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_public_profile_id ON users(public_profile_id)"))
        db.commit()

        # Popular valores para usuários sem ID público
        print("🔄 Populando public_profile_id para usuários existentes...")
        users = db.execute(text("SELECT id FROM users WHERE public_profile_id IS NULL OR public_profile_id = ''")).fetchall()
        print(f"Encontrados {len(users)} usuários sem public_profile_id")
        for (user_id,) in users:
            attempts = 0
            while attempts < 10:
                public_id = generate_numeric_id(10)
                try:
                    db.execute(text("UPDATE users SET public_profile_id = :pid WHERE id = :uid"), {"pid": public_id, "uid": user_id})
                    db.commit()
                    break
                except IntegrityError:
                    db.rollback()
                    attempts += 1
                    if attempts >= 10:
                        raise
        print("✅ Migração concluída com sucesso!")
    except Exception as e:
        db.rollback()
        print(f"❌ Erro durante a migração: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    migrate()
