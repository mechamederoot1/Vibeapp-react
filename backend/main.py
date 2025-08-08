from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import uvicorn
import os
from loguru import logger

from app.api import auth, users, posts, explore, notifications
from app.database.database import engine, create_tables

# Criar aplicação FastAPI
app = FastAPI(
    title="Vibe API",
    description="API da rede social Vibe",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Criar pasta de uploads se não existir
os.makedirs("uploads", exist_ok=True)

# Servir arquivos estáticos
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Incluir rotas da API
app.include_router(auth.router, prefix="/api/auth", tags=["Autenticação"])
app.include_router(users.router, prefix="/api/users", tags=["Usuários"])
app.include_router(posts.router, prefix="/api/posts", tags=["Posts"])
app.include_router(explore.router, prefix="/api/explore", tags=["Explorar"])
app.include_router(notifications.router, prefix="/api/notifications", tags=["Notificações"])

@app.on_event("startup")
async def startup_event():
    """Criar tabelas do banco de dados ao iniciar"""
    logger.info("🚀 Iniciando Vibe API...")
    create_tables()
    logger.info("✅ Banco de dados configurado")

@app.get("/")
async def root():
    """Endpoint raiz da API"""
    return {
        "message": "Vibe API está funcionando! 🚀",
        "version": "1.0.0",
        "docs": "/api/docs"
    }

@app.get("/health")
async def health_check():
    """Verificação de saúde da API"""
    return {"status": "healthy", "service": "vibe-api"}

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
