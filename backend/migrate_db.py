#!/usr/bin/env python3
"""
Script para migrar o banco de dados SQLite existente
Adiciona as novas colunas que foram criadas nos modelos
"""
import sqlite3
import os
from pathlib import Path

def migrate_database():
    """Aplicar migrações no banco SQLite"""
    
    # Caminho do banco de dados
    db_path = Path(__file__).parent / "vibe_social.db"
    
    if not db_path.exists():
        print("❌ Banco de dados não encontrado. Será criado automaticamente quando o servidor iniciar.")
        return
    
    print(f"🔧 Aplicando migrações no banco: {db_path}")
    
    try:
        # Conectar ao banco
        conn = sqlite3.connect(str(db_path))
        cursor = conn.cursor()
        
        # Lista de migrações para aplicar
        migrations = [
            # Adicionar background_color aos posts
            {
                "table": "posts",
                "column": "background_color",
                "type": "VARCHAR",
                "description": "Adicionar coluna background_color à tabela posts"
            },
            # Adicionar profile_update_type aos posts
            {
                "table": "posts", 
                "column": "profile_update_type",
                "type": "VARCHAR",
                "description": "Adicionar coluna profile_update_type à tabela posts"
            }
        ]
        
        applied_migrations = 0
        
        for migration in migrations:
            try:
                # Verificar se a coluna já existe
                cursor.execute(f"PRAGMA table_info({migration['table']})")
                columns = [row[1] for row in cursor.fetchall()]
                
                if migration['column'] not in columns:
                    # Aplicar migração
                    alter_sql = f"ALTER TABLE {migration['table']} ADD COLUMN {migration['column']} {migration['type']}"
                    cursor.execute(alter_sql)
                    print(f"✅ {migration['description']}")
                    applied_migrations += 1
                else:
                    print(f"⏭️  Coluna {migration['column']} j�� existe em {migration['table']}")
            
            except sqlite3.Error as e:
                print(f"❌ Erro ao aplicar migração {migration['description']}: {e}")
        
        # Criar tabela stories se não existir
        try:
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS stories (
                    id INTEGER PRIMARY KEY,
                    author_id INTEGER NOT NULL,
                    story_type VARCHAR NOT NULL DEFAULT 'text',
                    content TEXT,
                    media_url VARCHAR,
                    background_gradient VARCHAR,
                    text_elements JSON,
                    privacy VARCHAR NOT NULL DEFAULT 'public',
                    duration_hours INTEGER DEFAULT 24,
                    views_count INTEGER DEFAULT 0,
                    is_active BOOLEAN DEFAULT 1,
                    is_archived BOOLEAN DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    expires_at DATETIME,
                    FOREIGN KEY (author_id) REFERENCES users (id)
                )
            """)
            print("✅ Tabela stories criada/verificada")
            applied_migrations += 1
        except sqlite3.Error as e:
            print(f"❌ Erro ao criar tabela stories: {e}")
        
        # Criar tabela story_views se não existir
        try:
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS story_views (
                    id INTEGER PRIMARY KEY,
                    story_id INTEGER NOT NULL,
                    viewer_id INTEGER NOT NULL,
                    viewed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (story_id) REFERENCES stories (id),
                    FOREIGN KEY (viewer_id) REFERENCES users (id)
                )
            """)
            print("✅ Tabela story_views criada/verificada")
            applied_migrations += 1
        except sqlite3.Error as e:
            print(f"❌ Erro ao criar tabela story_views: {e}")
        
        # Commit das mudanças
        conn.commit()
        conn.close()
        
        print(f"\n🎉 Migração concluída! {applied_migrations} alterações aplicadas.")
        print("✅ Banco de dados atualizado com sucesso!")
        
    except sqlite3.Error as e:
        print(f"❌ Erro geral na migração: {e}")
    except Exception as e:
        print(f"❌ Erro inesperado: {e}")

if __name__ == "__main__":
    print("🚀 Iniciando migração do banco de dados...")
    migrate_database()
