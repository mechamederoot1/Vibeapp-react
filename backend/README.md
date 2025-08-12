# Vibe Social - Backend

Backend da aplicação Vibe Social usando FastAPI e SQLite.

## 🚀 Setup Rápido

### 1. Instalar dependências
```bash
pip install -r requirements.txt
```

### 2. Inicializar banco de dados
```bash
python init_database.py
```

### 3. Iniciar servidor
```bash
python main.py
```

## 📊 Banco de Dados

- **Tipo**: SQLite
- **Arquivo**: `./vibe_social.db`
- **Tabelas**: Criadas automaticamente pelo script de inicialização

### Tabelas criadas:
- users
- account_settings
- posts
- post_likes
- comments
- shares
- post_reactions
- comment_reactions
- stories
- story_views
- friendships
- profile_views
- notifications

## 🔧 Desenvolvimento

- **API Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health
- **Debug**: Mude `echo=True` no `database.py` para ver SQL

## 📝 Estrutura

```
backend/
├── app/
│   ├── api/           # Rotas da API
│   ├── database/      # Configuração do banco
│   ├── models/        # Modelos SQLAlchemy
│   └── schemas/       # Schemas Pydantic
├── init_database.py  # Script de inicialização
├── main.py           # Servidor principal
└── requirements.txt  # Dependências
```
