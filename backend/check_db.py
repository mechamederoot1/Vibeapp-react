#!/usr/bin/env python3

import sys
import os
from pathlib import Path

# Adicionar diretório atual ao path
sys.path.insert(0, str(Path(__file__).parent))

try:
    from app.database.database import engine
    from sqlalchemy import text, inspect
    from app.models.user import User
    from app.models.account_settings import AccountSettings
    
    print("🔍 Verificando estado do banco de dados...")
    
    # Conectar ao banco
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    
    print(f"📊 Tabelas encontradas ({len(tables)}):")
    for table in sorted(tables):
        print(f"  ✓ {table}")
    
    # Verificar dados básicos
    with engine.connect() as conn:
        # Contar usuários
        result = conn.execute(text("SELECT COUNT(*) FROM users"))
        users_count = result.fetchone()[0]
        print(f"\n👥 Usuários cadastrados: {users_count}")
        
        if users_count > 0:
            # Mostrar alguns usuários
            result = conn.execute(text("SELECT id, email, first_name, last_name, username, created_at FROM users LIMIT 3"))
            users = result.fetchall()
            print("\n📋 Primeiros usuários:")
            for user in users:
                print(f"  ID: {user[0]}, Email: {user[1]}, Nome: {user[2]} {user[3]}, Username: {user[4]}")
        
        # Verificar account_settings
        if 'account_settings' in tables:
            result = conn.execute(text("SELECT COUNT(*) FROM account_settings"))
            settings_count = result.fetchone()[0]
            print(f"\n⚙️ Configurações de conta: {settings_count}")
        
        # Verificar se há algum erro nas tabelas essenciais
        essential_tables = ['users', 'account_settings', 'friendships', 'posts']
        missing_tables = [t for t in essential_tables if t not in tables]
        
        if missing_tables:
            print(f"\n❌ Tabelas essenciais ausentes: {missing_tables}")
        else:
            print(f"\n✅ Todas as tabelas essenciais estão presentes")
    
    print(f"\n🎊 Banco de dados verificado com sucesso!")
    
except Exception as e:
    print(f"❌ Erro ao verificar banco: {str(e)}")
    import traceback
    traceback.print_exc()
