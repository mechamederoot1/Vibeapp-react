# 🚀 Deploy do Vibe Social com HTTPS

Este diretório contém todas as configurações necessárias para fazer o deploy do Vibe Social no seu VPS com nginx e SSL/HTTPS.

## 📋 Configuração

- **Frontend**: Porta 4001 (React/Vite)
- **Backend**: Porta 3010 (FastAPI/Python)
- **Nginx**: Proxy reverso com SSL
- **Domínio**: meuvibe.com

## 🔧 Arquivos Incluídos

### Configurações do Nginx
- `nginx.conf` - Configuração principal do nginx
- `sites-available/meuvibe.com` - Configuração do site com SSL

### Scripts de Deploy
- `deploy.sh` - Script completo de deploy automático
- `setup-ssl.sh` - Script apenas para configurar SSL
- `manage-services.sh` - Script para gerenciar os serviços

### Serviços Systemd
- `systemd/vibe-backend.service` - Serviço do backend
- `systemd/vibe-frontend.service` - Serviço do frontend

## 🚀 Deploy Rápido (Recomendado)

Para fazer o deploy completo automaticamente:

```bash
# 1. Copie todo o projeto para o VPS
scp -r ./vibe-social root@seu-servidor:/opt/

# 2. Conecte no VPS
ssh root@seu-servidor

# 3. Execute o deploy automático
cd /opt/vibe-social/nginx
chmod +x *.sh
./deploy.sh
```

O script irá:
- ✅ Instalar todas as dependências
- ✅ Configurar nginx com SSL
- ✅ Obter certificado Let's Encrypt
- ✅ Configurar serviços systemd
- ✅ Iniciar automaticamente tudo

## 🔧 Deploy Manual (Passo a Passo)

### 1. Preparar o Servidor

```bash
# Atualizar sistema
apt update && apt upgrade -y

# Instalar dependências
apt install nginx certbot python3-certbot-nginx nodejs npm python3 python3-pip -y

# Criar diretórios
mkdir -p /opt/vibe-social
mkdir -p /var/www/certbot
```

### 2. Copiar Código

```bash
# Copiar projeto para /opt/vibe-social
# Certifique-se que as pastas frontend/ e backend/ existem
```

### 3. Configurar SSL

```bash
cd /opt/vibe-social/nginx
chmod +x setup-ssl.sh

# Editar o script para seu email
nano setup-ssl.sh  # Altere "seu-email@exemplo.com"

# Executar configuração SSL
./setup-ssl.sh
```

### 4. Instalar Dependências

```bash
# Frontend
cd /opt/vibe-social/frontend
npm install

# Backend
cd /opt/vibe-social/backend
pip3 install -r requirements.txt
```

### 5. Configurar Serviços

```bash
# Copiar serviços systemd
cp /opt/vibe-social/nginx/systemd/*.service /etc/systemd/system/

# Habilitar e iniciar
systemctl daemon-reload
systemctl enable vibe-backend vibe-frontend
systemctl start vibe-backend vibe-frontend
```

## 🎮 Gerenciamento dos Serviços

Use o script `manage-services.sh` para gerenciar facilmente:

```bash
# Instalar globalmente
cp manage-services.sh /usr/local/bin/vibe-manage
chmod +x /usr/local/bin/vibe-manage

# Usar comandos
vibe-manage status              # Ver status
vibe-manage start all           # Iniciar tudo
vibe-manage stop all            # Parar tudo
vibe-manage restart all         # Reiniciar tudo
vibe-manage restart frontend    # Reiniciar só frontend
vibe-manage restart backend     # Reiniciar só backend
vibe-manage logs frontend       # Ver logs do frontend
vibe-manage logs backend        # Ver logs do backend
vibe-manage logs nginx          # Ver logs do nginx
```

## 🔍 Verificação e Troubleshooting

### Verificar Status dos Serviços

```bash
# Status geral
vibe-manage status

# Status detalhado
systemctl status vibe-backend
systemctl status vibe-frontend
systemctl status nginx

# Verificar portas
netstat -tlnp | grep -E ':4001|:3010|:80|:443'
```

### Ver Logs

```bash
# Logs dos serviços
journalctl -u vibe-backend -f
journalctl -u vibe-frontend -f

# Logs do nginx
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# Usando o script de gerenciamento
vibe-manage logs backend
vibe-manage logs frontend
vibe-manage logs nginx
```

### Problemas Comuns

#### 1. Porta já em uso
```bash
# Verificar o que está usando a porta
lsof -i :4001
lsof -i :3010

# Matar processo se necessário
kill -9 <PID>
```

#### 2. SSL não funciona
```bash
# Verificar certificado
certbot certificates

# Renovar manualmente
certbot renew

# Verificar configuração nginx
nginx -t
```

#### 3. Frontend não carrega
```bash
# Verificar se o processo está rodando
ps aux | grep npm

# Verificar logs
journalctl -u vibe-frontend -f

# Reiniciar
vibe-manage restart frontend
```

#### 4. API não funciona
```bash
# Verificar se o backend está rodando
ps aux | grep python

# Verificar logs
journalctl -u vibe-backend -f

# Reiniciar
vibe-manage restart backend
```

## 🌐 Configuração de DNS

Certifique-se de que seu DNS está apontando para o servidor:

```
# Tipo A
meuvibe.com     → IP_DO_SEU_SERVIDOR
www.meuvibe.com → IP_DO_SEU_SERVIDOR
```

## 🔒 Segurança

### Firewall
```bash
ufw enable
ufw allow ssh
ufw allow 80
ufw allow 443
```

### Renovação Automática SSL
O deploy automático configura um cron job para renovar o SSL:
```bash
# Ver cron jobs
crontab -l

# Renovar manualmente
certbot renew
```

## 📁 Estrutura de Arquivos no Servidor

```
/opt/vibe-social/
├── frontend/           # Código React
├── backend/            # Código Python
├── nginx/             # Configurações nginx
└── uploads/           # Arquivos uploaded

/etc/nginx/
├── nginx.conf
├── sites-available/
│   └── meuvibe.com
└── sites-enabled/
    └── meuvibe.com

/etc/systemd/system/
├── vibe-backend.service
└── vibe-frontend.service

/etc/letsencrypt/live/meuvibe.com/
├── fullchain.pem
└── privkey.pem
```

## 🎯 URLs Finais

Após o deploy bem-sucedido:

- **Site Principal**: https://meuvibe.com
- **API**: https://meuvibe.com/api
- **WebSocket**: wss://meuvibe.com/ws
- **Uploads**: https://meuvibe.com/uploads

## 📞 Suporte

Se encontrar problemas:

1. Verifique os logs: `vibe-manage logs [serviço]`
2. Verifique o status: `vibe-manage status`
3. Teste a configuração nginx: `nginx -t`
4. Verifique as portas: `netstat -tlnp`
5. Verifique o SSL: `certbot certificates`
