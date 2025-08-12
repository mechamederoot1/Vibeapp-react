# Setup Azure MySQL Database

Este documento explica como configurar e conectar a aplicação Vibe Social ao banco de dados Azure MySQL.

## 📋 Pré-requisitos

1. Banco de dados Azure MySQL configurado
2. Python 3.8+ instalado
3. Credenciais de acesso ao banco

## 🔧 Configuração

### 1. Configurar Variáveis de Ambiente

As configurações do banco estão no arquivo `.env`:

```bash
# Configurações do Banco de Dados MySQL Azure
DB_HOST=evoque-database.mysql.database.azure.com
DB_USER=infra
DB_PASSWORD=Evoque12@
DB_NAME=testes
DB_PORT=3306

# JWT Secret Key
SECRET_KEY=your-super-secret-jwt-key-change-in-production

# Environment
ENVIRONMENT=development
```

### 2. Instalar Dependências

```bash
pip install -r requirements.txt
```

### 3. Testar Conexão

Antes de criar as tabelas, teste a conexão:

```bash
python test_connection.py
```

### 4. Configurar Banco de Dados

Execute o script de setup para criar todas as tabelas:

```bash
python setup_azure_database.py
```

Este script irá:
- ✅ Testar conexão com Azure MySQL
- ✅ Criar banco de dados se não existir
- ✅ Criar todas as tabelas necessárias
- ✅ Verificar estrutura das tabelas
- ✅ Opcionalmente criar dados de demonstração

### 5. Iniciar Aplicação

```bash
python main.py
```

## 📊 Estrutura do Banco

### Tabelas Criadas

- **users** - Usuários da aplicação
- **account_settings** - Configurações de conta
- **posts** - Posts dos usuários  
- **post_likes** - Curtidas nos posts
- **comments** - Comentários nos posts
- **shares** - Compartilhamentos
- **post_reactions** - Reações nos posts
- **comment_reactions** - Reações nos comentários
- **stories** - Stories dos usuários
- **story_views** - Visualizações de stories
- **friendships** - Relacionamentos entre usuários
- **profile_views** - Visualizações de perfil
- **notifications** - Notificações

## 🛠️ Troubleshooting

### Erro de Conexão

Se houver problemas de conexão:

1. **Verificar credenciais**: Confirme se usuário, senha e host estão corretos
2. **Firewall**: Verifique se o IP está liberado no Azure MySQL
3. **SSL**: O Azure MySQL requer conexão SSL por padrão
4. **Rede**: Confirme conectividade com o servidor Azure

### Comandos Úteis

```bash
# Testar apenas a conexão
python test_connection.py

# Recriar todas as tabelas (CUIDADO: apaga dados)
python setup_azure_database.py

# Ver logs do servidor
python main.py
```

### Configuração de Firewall no Azure

1. Acesse o portal Azure
2. Navegue até o servidor MySQL
3. Em "Connection security", adicione seu IP
4. Ou configure para permitir acesso de qualquer IP (0.0.0.0 - 255.255.255.255)

## 🔐 Segurança

- ✅ Senhas são criptografadas com bcrypt
- ✅ Conexão SSL habilitada
- ✅ JWT tokens para autenticação
- ✅ Validação de entrada em todas APIs
- ✅ Soft-delete para dados sensíveis

## 📊 Dados de Demonstração

O script oferece criar um usuário demo:
- **Email**: demo@vibesocial.com
- **Senha**: demo123

## 🚀 Deploy

Para produção:
1. Configure `ENVIRONMENT=production` no .env
2. Use uma SECRET_KEY forte e única
3. Configure backup automático no Azure
4. Monitore logs e performance

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs do aplicativo
2. Execute `python test_connection.py`
3. Confirme configurações do Azure MySQL
4. Verifique conectividade de rede
