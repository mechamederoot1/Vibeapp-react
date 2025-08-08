from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import date
import random
import sqlite3
import os
from pathlib import Path
from ..database.database import get_db, engine
from ..models.user import User
from ..models.post import Post

router = APIRouter()

@router.post("/create-test-users")
async def create_test_users(db: Session = Depends(get_db)):
    """Criar usuários teste para desenvolvimento"""
    
    # Lista de usuários teste
    test_users_data = [
        {
            "email": "maria.silva@email.com",
            "first_name": "Maria",
            "last_name": "Silva", 
            "username": "maria.silva",
            "password": "senha123",
            "bio": "Apaixonada por viagens e fotografia! 📸✈️\nSempre em busca de novos horizontes e momentos únicos.\n#ViagemLouca #FotografiaVida",
            "location": "São Paulo, SP",
            "website": "https://mariaviaja.blog",
            "birth_date": date(1995, 3, 15),
            "gender": "female",
            "avatar": "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face",
            "cover_photo": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=300&fit=crop"
        },
        {
            "email": "joao.santos@email.com",
            "first_name": "João",
            "last_name": "Santos",
            "username": "joao.santos",
            "password": "senha123",
            "bio": "Developer & Tech Enthusiast 💻\nCoding by day, gaming by night 🎮\nCoffee addict ☕",
            "location": "Rio de Janeiro, RJ",
            "website": "https://github.com/joaosantos",
            "birth_date": date(1990, 7, 22),
            "gender": "male",
            "avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face",
            "cover_photo": "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=300&fit=crop"
        },
        {
            "email": "ana.costa@email.com",
            "first_name": "Ana",
            "last_name": "Costa",
            "username": "ana.costa",
            "password": "senha123",
            "bio": "Artista digital e designer 🎨\nTransformando ideias em arte desde 2018\n✨ Criatividade em cada pixel",
            "location": "Belo Horizonte, MG",
            "website": "https://anacosta.design",
            "birth_date": date(1993, 11, 8),
            "gender": "female",
            "avatar": "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face",
            "cover_photo": "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800&h=300&fit=crop"
        },
        {
            "email": "pedro.oliveira@email.com", 
            "first_name": "Pedro",
            "last_name": "Oliveira",
            "username": "pedro.oliveira",
            "password": "senha123",
            "bio": "Empreendedor e amante de esportes 🏃‍♂️\nCorredor nas horas vagas | Mindset de crescimento\n💪 Sempre em movimento!",
            "location": "Porto Alegre, RS",
            "website": "",
            "birth_date": date(1988, 5, 3),
            "gender": "male",
            "avatar": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face",
            "cover_photo": "https://images.unsplash.com/photo-1544717297-fa95b6ee9643?w=800&h=300&fit=crop"
        },
        {
            "email": "carla.fernandes@email.com",
            "first_name": "Carla",
            "last_name": "Fernandes",
            "username": "carla.fernandes",
            "password": "senha123",
            "bio": "Chef e foodie apaixonada! 👩‍🍳🍝\nCompartilhando receitas e momentos deliciosos\n#CozinhaComAmor #FoodLover",
            "location": "Salvador, BA",
            "website": "https://carlarecitas.com.br",
            "birth_date": date(1992, 9, 17),
            "gender": "female",
            "avatar": "https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=400&h=400&fit=crop&crop=face",
            "cover_photo": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=300&fit=crop"
        },
        {
            "email": "lucas.almeida@email.com",
            "first_name": "Lucas",
            "last_name": "Almeida",
            "username": "lucas.almeida",
            "password": "senha123",
            "bio": "Músico e produtor musical 🎵🎸\nCriando sons que tocam a alma\nRock, Pop, Eletrônica - sem limites!",
            "location": "Recife, PE",
            "website": "https://soundcloud.com/lucasalmeida",
            "birth_date": date(1991, 12, 25),
            "gender": "male",
            "avatar": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face",
            "cover_photo": "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=300&fit=crop"
        }
    ]
    
    created_users = []
    
    for user_data in test_users_data:
        # Verificar se o email já existe
        existing_user = db.query(User).filter(User.email == user_data["email"]).first()
        if existing_user:
            continue
        
        # Criar novo usuário
        new_user = User(
            email=user_data["email"],
            first_name=user_data["first_name"],
            last_name=user_data["last_name"],
            username=user_data["username"],
            bio=user_data["bio"],
            location=user_data["location"],
            website=user_data["website"],
            birth_date=user_data["birth_date"],
            gender=user_data["gender"],
            avatar=user_data["avatar"],
            cover_photo=user_data["cover_photo"],
            is_verified=random.choice([True, False])
        )
        new_user.set_password(user_data["password"])
        
        db.add(new_user)
        created_users.append(new_user)
    
    db.commit()
    
    # Refresh dos objetos para ter os IDs
    for user in created_users:
        db.refresh(user)
    
    # Criar alguns posts teste
    posts_data = [
        "Acabei de chegar em Paris! A cidade está linda nesta época do ano 🇫🇷✨ #Paris #Viagem",
        "Trabalhando em um novo projeto incrível! Logo vocês vão ver o resultado 💻🚀",
        "Sunset vibes 🌅 Nada melhor que terminar o dia contemplando a natureza",
        "Novo prato testado e aprovado! Receita no meu blog 👩‍🍳🍝",
        "Session de studio hoje! Gravando algumas ideias novas 🎵🎸",
        "Corrida matinal concluída! 10km em boa companhia ☀️🏃‍♂️"
    ]
    
    created_posts = []
    for i, user in enumerate(created_users):
        if i < len(posts_data):
            post = Post(
                content=posts_data[i],
                type="text",
                author_id=user.id,
                likes_count=random.randint(5, 50),
                comments_count=random.randint(0, 15),
                reposts_count=random.randint(0, 10)
            )
            db.add(post)
            created_posts.append(post)
    
    db.commit()
    
    return {
        "message": f"{len(created_users)} usuários teste criados com sucesso!",
        "users_created": len(created_users),
        "posts_created": len(created_posts),
        "users": [user.to_dict() for user in created_users],
        "login_info": {
            "password": "senha123",
            "note": "Use qualquer email listado acima com a senha 'senha123'"
        }
    }

@router.get("/test-users")
async def list_test_users(db: Session = Depends(get_db)):
    """Listar todos os usuários teste criados"""
    users = db.query(User).all()
    return {
        "total_users": len(users),
        "users": [user.to_dict() for user in users]
    }

@router.post("/migrate-database")
async def migrate_database():
    """Migrar banco de dados para adicionar novas colunas"""

    try:
        # Obter a URL do banco do engine
        db_url = str(engine.url)

        if not db_url.startswith("sqlite"):
            return {"error": "Migração suportada apenas para SQLite"}

        # Extrair o caminho do arquivo
        db_path = db_url.replace("sqlite:///", "").replace("sqlite://", "")
        if not db_path.startswith("/"):
            db_path = os.path.abspath(db_path)

        if not os.path.exists(db_path):
            return {"error": "Banco de dados não encontrado"}

        # Conectar ao banco
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        applied_migrations = []

        # Migrações para aplicar
        migrations = [
            {
                "table": "posts",
                "column": "background_color",
                "type": "VARCHAR",
                "description": "Adicionar coluna background_color"
            },
            {
                "table": "posts",
                "column": "profile_update_type",
                "type": "VARCHAR",
                "description": "Adicionar coluna profile_update_type"
            }
        ]

        for migration in migrations:
            try:
                # Verificar se a coluna já existe
                cursor.execute(f"PRAGMA table_info({migration['table']})")
                columns = [row[1] for row in cursor.fetchall()]

                if migration['column'] not in columns:
                    # Aplicar migração
                    alter_sql = f"ALTER TABLE {migration['table']} ADD COLUMN {migration['column']} {migration['type']}"
                    cursor.execute(alter_sql)
                    applied_migrations.append(migration['description'])

            except sqlite3.Error as e:
                applied_migrations.append(f"ERRO: {migration['description']} - {str(e)}")

        # Criar tabelas de stories se não existirem
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
            applied_migrations.append("Tabela stories criada/verificada")
        except sqlite3.Error as e:
            applied_migrations.append(f"ERRO: Tabela stories - {str(e)}")

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
            applied_migrations.append("Tabela story_views criada/verificada")
        except sqlite3.Error as e:
            applied_migrations.append(f"ERRO: Tabela story_views - {str(e)}")

        # Commit e fechar
        conn.commit()
        conn.close()

        return {
            "message": "Migração concluída",
            "applied_migrations": applied_migrations,
            "total_applied": len(applied_migrations),
            "success": True
        }

    except Exception as e:
        import traceback
        return {
            "error": f"Erro durante migração: {str(e)}",
            "traceback": traceback.format_exc(),
            "success": False
        }
