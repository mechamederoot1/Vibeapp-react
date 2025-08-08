#!/usr/bin/env python3

"""
Script de teste para verificar se o backend inicia corretamente
"""

import sys
import os

# Adicionar o diretório atual ao PYTHONPATH
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    print("🔍 Testando imports...")
    
    # Testar imports básicos
    from app.database.database import engine, Base
    print("✅ Database imports OK")
    
    # Testar imports de modelos
    from app.models.user import User
    from app.models.post import Post, PostLike, Comment, Share
    from app.models.friendship import Friendship
    from app.models.profile_view import ProfileView
    from app.models.notification import Notification
    print("✅ Models imports OK")
    
    # Testar imports de APIs
    from app.api.auth import router as auth_router
    print("✅ Auth router OK")
    
    from app.api.users import router as users_router
    print("✅ Users router OK")
    
    from app.api.posts import router as posts_router
    print("✅ Posts router OK")
    
    # Testar criação do FastAPI app
    from fastapi import FastAPI
    from fastapi.middleware.cors import CORSMiddleware
    
    app = FastAPI(title="Vibe Social API Test")
    
    # Configurar CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # Incluir routers
    app.include_router(auth_router, prefix="/api/auth", tags=["authentication"])
    app.include_router(users_router, prefix="/api/users", tags=["users"])
    app.include_router(posts_router, prefix="/api/posts", tags=["posts"])
    
    print("✅ FastAPI app criado com sucesso")
    
    # Criar tabelas do banco
    Base.metadata.create_all(bind=engine)
    print("✅ Tabelas do banco criadas")
    
    print("\n🎉 SUCESSO! Backend pode ser iniciado.")
    print("\n💡 Para iniciar o servidor:")
    print("   python main.py")
    print("\n📱 Acesso:")
    print("   Local: http://localhost:8000")
    print("   Rede: http://SEU_IP:8000")
    
except Exception as e:
    print(f"\n❌ ERRO: {e}")
    print(f"\n🔧 Tipo do erro: {type(e).__name__}")
    import traceback
    print(f"\n📍 Traceback completo:")
    traceback.print_exc()
    sys.exit(1)
