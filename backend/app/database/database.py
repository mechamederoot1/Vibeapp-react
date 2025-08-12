from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Try to import from env.py as fallback
try:
    import sys
    sys.path.append('..')
    import env as env_config
    print("📁 Carregando configurações do env.py")
except ImportError:
    env_config = None
    print("📁 env.py não encontrado, usando variáveis de ambiente")

# Database configuration
DB_HOST = os.getenv("DB_HOST") or (env_config.DB_HOST if env_config else "localhost")
DB_USER = os.getenv("DB_USER") or (env_config.DB_USER if env_config else "root")
DB_PASSWORD = os.getenv("DB_PASSWORD") or (env_config.DB_PASSWORD if env_config else "")
DB_NAME = os.getenv("DB_NAME") or (env_config.DB_NAME if env_config else "vibe_social")
DB_PORT = os.getenv("DB_PORT") or (env_config.DB_PORT if env_config else "3306")

# Construct database URL
if DB_HOST and DB_USER and DB_PASSWORD and DB_NAME:
    # MySQL/Azure configuration
    DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}?charset=utf8mb4"
else:
    # Fallback to SQLite for local development
    DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./vibe_social.db")

print(f"🔗 Connecting to database: {DATABASE_URL.replace(DB_PASSWORD, '***') if DB_PASSWORD else DATABASE_URL}")

# Create engine
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
        echo=False  # Set to True for debugging
    )
else:
    # MySQL configuration
    engine = create_engine(
        DATABASE_URL,
        echo=False,  # Set to True for debugging
        pool_pre_ping=True,
        pool_recycle=300,
        connect_args={
            "charset": "utf8mb4",
            "autocommit": False
        }
    )

# Create SessionLocal class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create Base class
Base = declarative_base()

# Dependency to get database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
