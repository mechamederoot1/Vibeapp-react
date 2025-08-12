# Vibe - Rede Social

Uma rede social moderna e responsiva inspirada no Instagram, construída com React + FastAPI.

## 📁 Estrutura do Projeto

```
vibe-social/
├── frontend/                 # React + Vite + PWA
│   ├── src/
│   │   ├── components/      # Componentes reutilizáveis
│   │   ├── pages/          # Páginas da aplicação
│   │   ├── hooks/          # Custom hooks
│   │   ├── services/       # APIs e serviços
│   │   ├── utils/          # Utilitários
│   │   ├── styles/         # Estilos globais
│   │   └── constants/      # Constantes
│   ├── public/             # Arquivos estáticos
│   └── package.json
├── backend/                 # FastAPI + SQLite
│   ├── app/
│   │   ├── api/           # Endpoints da API
│   │   ├── models/        # Modelos de dados
│   │   ├── services/      # Lógica de negócio
│   │   ├── database/      # Configuração do banco
│   │   └── utils/         # Utilitários
│   ├── requirements.txt
│   └── main.py
└── docs/                   # Documentação
```

## 🚀 Como executar

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Backend
```bash
cd backend
pip install -r requirements.txt
python main.py
```

## 📱 Funcionalidades

- ✅ Feed de posts com stories
- ✅ Perfil com capa e avatar centralizado
- ✅ Sistema de amigos
- ✅ Explorar conteúdo
- ✅ Notificações
- ✅ Câmera integrada (PWA)
- ✅ Geolocalização
- ✅ Design responsivo mobile-first
- ✅ Controle de privacidade

## 🛠 Tecnologias

### Frontend
- React 18
- Vite
- Tailwind CSS
- PWA
- React Router

### Backend
- FastAPI
- SQLite
- Pydantic
- SQLAlchemy
