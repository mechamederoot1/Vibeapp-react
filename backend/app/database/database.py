from sqlalchemy import create_engine, MetaData
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# URL do banco de dados SQLite
DATABASE_URL = "sqlite:///./vibe.db"

# Criar engine do SQLAlchemy
engine = create_engine(
    DATABASE_URL, 
    connect_args={"check_same_thread": False},
    echo=True  # Para debug, remover em produção
)

# Criar sessão
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base para os modelos
Base = declarative_base()

# Metadata para migrations
metadata = MetaData()

def get_db():
    """Dependency para obter sessão do banco de dados"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def create_tables():
    """Criar todas as tabelas"""
    Base.metadata.create_all(bind=engine)
