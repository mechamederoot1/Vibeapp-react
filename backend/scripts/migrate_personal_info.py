#!/usr/bin/env python3
"""
Script para migrar o banco de dados e adicionar a tabela personal_info
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database.database import engine, Base
from app.models import PersonalInfo

def migrate_database():
    """Criar a tabela personal_info se ela não existir"""
    try:
        print("🔄 Iniciando migração do banco de dados...")
        
        # Criar apenas a tabela PersonalInfo
        PersonalInfo.__table__.create(bind=engine, checkfirst=True)
        
        print("✅ Tabela personal_info criada com sucesso!")
        
    except Exception as e:
        print(f"❌ Erro na migração: {e}")
        return False
    
    return True

if __name__ == "__main__":
    success = migrate_database()
    if success:
        print("🎉 Migração concluída com sucesso!")
    else:
        print("💥 Migração falhou!")
        sys.exit(1)
