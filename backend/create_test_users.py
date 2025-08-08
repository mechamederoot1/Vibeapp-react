#!/usr/bin/env python3
"""
Script para criar usuários teste na base de dados
"""
from sqlalchemy.orm import Session
from app.database.database import SessionLocal, engine
from app.models.user import User
from app.models.post import Post
from datetime import datetime, date
import random

def create_test_users():
    """Criar usuários teste"""
    db: Session = SessionLocal()
    
    try:
        # Verificar se já existem usuários
        existing_users = db.query(User).count()
        if existing_users > 0:
            print(f"Já existem {existing_users} usuários na base de dados.")
            response = input("Deseja adicionar novos usuários teste mesmo assim? (s/n): ")
            if response.lower() not in ['s', 'sim', 'y', 'yes']:
                print("Operação cancelada.")
                return
        
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
        
        print("Criando usuários teste...")
        for user_data in test_users_data:
            # Verificar se o email já existe
            existing_user = db.query(User).filter(User.email == user_data["email"]).first()
            if existing_user:
                print(f"❌ Usuário {user_data['email']} já existe, pulando...")
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
                is_verified=random.choice([True, False])  # Alguns verificados aleatoriamente
            )
            new_user.set_password(user_data["password"])
            
            db.add(new_user)
            created_users.append(new_user)
        
        # Commit das mudanças
        db.commit()
        
        # Refresh dos objetos para ter os IDs
        for user in created_users:
            db.refresh(user)
        
        print(f"\n✅ {len(created_users)} usuários teste criados com sucesso!")
        
        # Criar alguns posts teste para os usuários
        create_test_posts(db, created_users)
        
        # Mostrar informações dos usuários criados
        print("\n📋 Usuários criados:")
        print("-" * 60)
        for user in created_users:
            print(f"👤 {user.full_name} (@{user.username})")
            print(f"   📧 {user.email}")
            print(f"   📍 {user.location}")
            print(f"   🔗 {user.website or 'Nenhum website'}")
            print(f"   ✅ Verificado: {'Sim' if user.is_verified else 'Não'}")
            print()
        
        print("💡 Você pode fazer login com qualquer um destes usuários usando:")
        print("   📧 Email: qualquer email acima")
        print("   🔐 Senha: senha123")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Erro ao criar usuários: {e}")
        raise
    finally:
        db.close()

def create_test_posts(db: Session, users: list):
    """Criar alguns posts teste para os usuários"""
    print("\nCriando posts teste...")
    
    posts_data = [
        {
            "content": "Acabei de chegar em Paris! A cidade está linda nesta época do ano 🇫🇷✨ #Paris #Viagem",
            "type": "text"
        },
        {
            "content": "Trabalhando em um novo projeto incrível! Logo vocês vão ver o resultado 💻🚀",
            "type": "text"
        },
        {
            "content": "Sunset vibes 🌅 Nada melhor que terminar o dia contemplando a natureza",
            "type": "text"
        },
        {
            "content": "Novo prato testado e aprovado! Receita no meu blog 👩‍🍳🍝",
            "type": "text"
        },
        {
            "content": "Session de studio hoje! Gravando algumas ideias novas 🎵🎸",
            "type": "text"
        },
        {
            "content": "Corrida matinal concluída! 10km em boa companhia ☀️🏃‍♂️",
            "type": "text"
        }
    ]
    
    created_posts = []
    for i, user in enumerate(users):
        if i < len(posts_data):
            post = Post(
                content=posts_data[i]["content"],
                type=posts_data[i]["type"],
                author_id=user.id,
                likes_count=random.randint(5, 50),
                comments_count=random.randint(0, 15),
                reposts_count=random.randint(0, 10)
            )
            db.add(post)
            created_posts.append(post)
    
    db.commit()
    print(f"✅ {len(created_posts)} posts teste criados!")

if __name__ == "__main__":
    print("🚀 Vibe Social - Criador de Usuários Teste")
    print("=" * 50)
    create_test_users()
