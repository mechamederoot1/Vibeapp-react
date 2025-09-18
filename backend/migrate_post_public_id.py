"""
Migração para adicionar um ID público único de 10 dígitos para posts (public_id)
- Adiciona coluna public_id em posts (se não existir)
- Cria índice único
- Popula valores para registros existentes com retry no commit
Compatível com SQLite
"""
import sys, os, random, string
from sqlalchemy import text

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))
from app.database.database import SessionLocal


def column_exists_sqlite(db, table_name: str, column_name: str) -> bool:
    result = db.execute(text(f"PRAGMA table_info({table_name})"))
    for row in result.fetchall():
        if row[1] == column_name:
            return True
    return False


def gen_numeric_id(n=10) -> str:
    return ''.join(random.SystemRandom().choice(string.digits) for _ in range(n))


def migrate():
    from sqlalchemy.exc import IntegrityError
    db = SessionLocal()
    try:
        if not column_exists_sqlite(db, 'posts', 'public_id'):
            print("🔄 Adicionando coluna 'public_id' na tabela posts...")
            db.execute(text("ALTER TABLE posts ADD COLUMN public_id TEXT"))
            db.commit()
        else:
            print("✅ Coluna 'public_id' já existe")

        print("🔄 Criando índice único em posts.public_id (se não existir)...")
        db.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS idx_posts_public_id ON posts(public_id)"))
        db.commit()

        print("🔄 Populando public_id em posts existentes...")
        rows = db.execute(text("SELECT id FROM posts WHERE public_id IS NULL OR public_id = ''")).fetchall()
        print(f"Encontrados {len(rows)} posts sem public_id")
        for (pid,) in rows:
            attempts = 0
            while attempts < 10:
                public_id = gen_numeric_id(10)
                try:
                    db.execute(text("UPDATE posts SET public_id = :pub WHERE id = :id"), {"pub": public_id, "id": pid})
                    db.commit()
                    break
                except IntegrityError:
                    db.rollback()
                    attempts += 1
                    if attempts >= 10:
                        raise
        print("✅ Migra��ão concluída com sucesso!")
    except Exception as e:
        db.rollback()
        print(f"❌ Erro durante a migração: {e}")
        raise
    finally:
        db.close()


if __name__ == '__main__':
    migrate()
