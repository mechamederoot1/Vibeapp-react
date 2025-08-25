#!/usr/bin/env python3
"""
Migração para adicionar campo privacy na tabela posts
"""

import sys
import os
from sqlalchemy import text

# Adicionar o diretório do app ao Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from app.database.database import engine, SessionLocal

def migrate_post_privacy():
    """Adiciona coluna privacy na tabela posts"""
    
    db = SessionLocal()
    
    try:
        # Verificar se a coluna já existe
        result = db.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'posts' AND column_name = 'privacy'
        """))
        
        if result.fetchone():
            print("✅ Coluna 'privacy' já existe na tabela posts")
            return
        
        print("🔄 Adicionando coluna 'privacy' na tabela posts...")
        
        # Adicionar coluna privacy com valor padrão 'public'
        db.execute(text("""
            ALTER TABLE posts 
            ADD COLUMN privacy VARCHAR DEFAULT 'public' NOT NULL
        """))
        
        # Atualizar posts existentes para terem privacy = 'public'
        result = db.execute(text("""
            UPDATE posts 
            SET privacy = 'public' 
            WHERE privacy IS NULL OR privacy = ''
        """))
        
        db.commit()
        
        print(f"✅ Migração concluída com sucesso!")
        print(f"   - Coluna 'privacy' adicionada")
        print(f"   - {result.rowcount} posts atualizados com privacy = 'public'")
        
    except Exception as e:
        print(f"❌ Erro durante a migração: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    print("🚀 Iniciando migração de privacidade de posts...")
    migrate_post_privacy()
    print("🎉 Migração finalizada!")
