# 🚀 Quick Start - Azure MySQL Setup

## Execução Rápida

### 1. Instalar Dependências
```bash
cd backend
pip install PyMySQL==1.1.0 cryptography==41.0.8
```

### 2. Testar Conexão
```bash
python test_connection.py
```

### 3. Criar Tabelas
```bash
python setup_azure_database.py
```

### 4. Iniciar Servidor
```bash
python main.py
```

## 🔧 Configurações

As configurações estão nas variáveis de ambiente:
- `DB_HOST=evoque-database.mysql.database.azure.com`
- `DB_USER=infra`
- `DB_PASSWORD=Evoque12@`
- `DB_NAME=testes`
- `DB_PORT=3306`

## ✅ Verificação

Após executar o setup, você deve ver:
- ✅ Conexão com Azure MySQL estabelecida
- ✅ Banco 'testes' criado/verificado
- ✅ Todas as tabelas criadas
- ✅ Servidor rodando em http://localhost:8000

## 🎭 Usuário Demo

O script pode criar um usuário de teste:
- **Email**: demo@vibesocial.com
- **Senha**: demo123

## 📊 Tabelas Criadas

- users (usuários)
- account_settings (configurações)
- posts (publicações)
- post_likes (curtidas)
- comments (comentários)
- shares (compartilhamentos)
- post_reactions (reações)
- comment_reactions (reações em comentários)
- stories (stories)
- story_views (visualizações)
- friendships (amizades)
- profile_views (visualizações de perfil)
- notifications (notificações)

## 🛠️ Troubleshooting

Se der erro:
1. Verifique se as credenciais estão corretas
2. Confirme se o Azure MySQL está ativo
3. Verifique firewall/conectividade
4. Execute `python test_connection.py` para diagnóstico
