#!/usr/bin/env python3
"""
Script para migrar o banco de dados e adicionar as tabelas de highlights
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database.database import engine, Base
from app.models import Highlight, HighlightStory

def migrate_database():
    """Criar as tabelas de highlights se não existirem"""
    try:
        print("🔄 Iniciando migração do banco de dados para highlights...")
        
        # Criar tabelas de highlights
        Highlight.__table__.create(bind=engine, checkfirst=True)
        HighlightStory.__table__.create(bind=engine, checkfirst=True)
        
        print("✅ Tabelas de highlights criadas com sucesso!")
        print("- highlights (destaques)")
        print("- highlight_stories (stories nos destaques)")
        
    except Exception as e:
        print(f"❌ Erro na migração: {e}")
        return False
    
    return True

if __name__ == "__main__":
    success = migrate_database()
    if success:
        print("🎉 Migração de highlights concluída com sucesso!")
    else:
        print("💥 Migração de highlights falhou!")
        sys.exit(1)
