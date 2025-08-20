#!/usr/bin/env python3
"""
Script para migrar o banco de dados com as novas funcionalidades
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database.database import engine, Base
from app.models import *  # Importar todos os modelos

def migrate_database():
    """Criar todas as tabelas do banco de dados"""
    try:
        print("🔄 Iniciando migração do banco de dados...")
        
        # Criar todas as tabelas
        Base.metadata.create_all(bind=engine)
        
        print("✅ Migração concluída com sucesso!")
        print("\nTabelas criadas:")
        print("- users (usuários)")
        print("- posts (posts)")
        print("- post_likes (curtidas de posts)")
        print("- comments (comentários)")
        print("- post_reactions (reações de posts)")
        print("- comment_reactions (reações de comentários)")
        print("- notifications (notificações)")
        print("- messages (mensagens)")
        print("- conversations (conversas)")
        print("- post_shares (compartilhamentos)")
        print("- stories (stories)")
        print("- story_views (visualizações de stories)")
        print("- friendships (amizades)")
        print("- profile_views (visualizações de perfil)")
        print("- account_settings (configurações de conta)")
        print("- shares (compartilhamentos legados)")
        print("- personal_info (informações pessoais)")
        print("- highlights (destaques de stories)")
        print("- highlight_stories (stories nos destaques)")
        
    except Exception as e:
        print(f"❌ Erro durante a migração: {e}")
        return False
    
    return True

if __name__ == "__main__":
    success = migrate_database()
    sys.exit(0 if success else 1)
