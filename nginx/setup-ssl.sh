#!/bin/bash

# Script para configurar SSL com Let's Encrypt para meuvibe.com
# Execute este script como root no seu VPS

set -e

echo "🔧 Configurando SSL para meuvibe.com..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para log
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
    exit 1
}

warn() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

# Verificar se está rodando como root
if [[ $EUID -ne 0 ]]; then
   error "Este script deve ser executado como root"
fi

# Atualizar sistema
log "Atualizando sistema..."
apt update && apt upgrade -y

# Instalar nginx se não estiver instalado
if ! command -v nginx &> /dev/null; then
    log "Instalando nginx..."
    apt install nginx -y
else
    log "Nginx já está instalado"
fi

# Instalar certbot se não estiver instalado
if ! command -v certbot &> /dev/null; then
    log "Instalando certbot..."
    apt install certbot python3-certbot-nginx -y
else
    log "Certbot já está instalado"
fi

# Criar diretórios necessários
log "Criando diretórios..."
mkdir -p /etc/nginx/sites-available
mkdir -p /etc/nginx/sites-enabled
mkdir -p /var/www/certbot

# Backup da configuração atual do nginx
if [ -f /etc/nginx/nginx.conf ]; then
    log "Fazendo backup da configuração atual..."
    cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup.$(date +%Y%m%d_%H%M%S)
fi

# Copiar configuração do nginx
log "Copiando configuração do nginx..."
cp nginx.conf /etc/nginx/nginx.conf

# Copiar configuração do site
log "Copiando configuração do site..."
cp sites-available/meuvibe.com /etc/nginx/sites-available/

# Remover configuração padrão se existir
if [ -f /etc/nginx/sites-enabled/default ]; then
    log "Removendo configuração padrão..."
    rm /etc/nginx/sites-enabled/default
fi

# Criar link simbólico para ativar o site
log "Ativando site..."
ln -sf /etc/nginx/sites-available/meuvibe.com /etc/nginx/sites-enabled/

# Testar configuração do nginx
log "Testando configuração do nginx..."
nginx -t || error "Erro na configuração do nginx"

# Configuração temporária para obter certificado SSL
log "Criando configuração temporária para certificado SSL..."
cat > /etc/nginx/sites-available/meuvibe.com.temp << 'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name meuvibe.com www.meuvibe.com;
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        proxy_pass http://127.0.0.1:4001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Ativar configuração temporária
ln -sf /etc/nginx/sites-available/meuvibe.com.temp /etc/nginx/sites-enabled/meuvibe.com

# Recarregar nginx
log "Recarregando nginx..."
systemctl reload nginx

# Obter certificado SSL
log "Obtendo certificado SSL..."
echo "⚠️  Certifique-se de que os domínios meuvibe.com e www.meuvibe.com estão apontando para este servidor!"
read -p "Pressione Enter para continuar ou Ctrl+C para cancelar..."

certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email seu-email@exemplo.com \
    --agree-tos \
    --no-eff-email \
    -d meuvibe.com \
    -d www.meuvibe.com

# Verificar se o certificado foi criado
if [ ! -f /etc/letsencrypt/live/meuvibe.com/fullchain.pem ]; then
    error "Falha ao obter certificado SSL"
fi

# Ativar configuração final com SSL
log "Ativando configuração final com SSL..."
ln -sf /etc/nginx/sites-available/meuvibe.com /etc/nginx/sites-enabled/meuvibe.com

# Testar configuração final
log "Testando configuração final..."
nginx -t || error "Erro na configuração final do nginx"

# Recarregar nginx
log "Recarregando nginx..."
systemctl reload nginx

# Configurar renovação automática
log "Configurando renovação automática do certificado..."
(crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -

# Habilitar e iniciar nginx
log "Habilitando nginx para iniciar automaticamente..."
systemctl enable nginx
systemctl start nginx

# Status final
log "✅ Configuração concluída!"
echo ""
echo "🎉 SSL configurado com sucesso para meuvibe.com!"
echo ""
echo "📋 Resumo da configuração:"
echo "   - Frontend (React): https://meuvibe.com (proxy para porta 4001)"
echo "   - Backend API: https://meuvibe.com/api (proxy para porta 3010)"
echo "   - WebSocket: wss://meuvibe.com/ws"
echo "   - Uploads: https://meuvibe.com/uploads"
echo ""
echo "🔄 Para renovar o certificado manualmente:"
echo "   sudo certbot renew"
echo ""
echo "📝 Logs do nginx:"
echo "   - Acesso: /var/log/nginx/access.log"
echo "   - Erro: /var/log/nginx/error.log"
echo ""
echo "⚠️  Lembre-se de:"
echo "   1. Configurar firewall para permitir portas 80 e 443"
echo "   2. Verificar se o frontend e backend estão rodando nas portas corretas"
echo "   3. Testar a aplicação em https://meuvibe.com"

log "Verificando status dos serviços..."
systemctl status nginx --no-pager -l
