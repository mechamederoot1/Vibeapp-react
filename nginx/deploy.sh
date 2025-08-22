#!/bin/bash

# Script de deploy completo para Vibe Social no VPS
# Este script configura nginx, SSL, e os serviços

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configurações
PROJECT_DIR="/opt/vibe-social"
DOMAIN="meuvibe.com"
EMAIL="seu-email@exemplo.com"  # Altere para seu email

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

info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

# Verificar se está rodando como root
if [[ $EUID -ne 0 ]]; then
   error "Este script deve ser executado como root"
fi

# Função para verificar se um comando existe
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Função para instalar Node.js se não estiver instalado
install_nodejs() {
    if ! command_exists node; then
        log "Instalando Node.js..."
        curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
        apt-get install -y nodejs
    else
        log "Node.js já está instalado: $(node --version)"
    fi
}

# Função para instalar Python se não estiver instalado
install_python() {
    if ! command_exists python3; then
        log "Instalando Python 3..."
        apt install python3 python3-pip python3-venv -y
    else
        log "Python 3 já está instalado: $(python3 --version)"
    fi
}

# Início do script
log "🚀 Iniciando deploy do Vibe Social..."

# Atualizar sistema
log "Atualizando sistema..."
apt update && apt upgrade -y

# Instalar dependências básicas
log "Instalando dependências básicas..."
apt install -y curl wget git unzip software-properties-common lsof net-tools

# Instalar Node.js e Python
install_nodejs
install_python

# Instalar nginx
if ! command_exists nginx; then
    log "Instalando nginx..."
    apt install nginx -y
else
    log "Nginx já está instalado"
fi

# Instalar certbot
if ! command_exists certbot; then
    log "Instalando certbot..."
    apt install certbot python3-certbot-nginx -y
else
    log "Certbot já está instalado"
fi

# Criar usuário e grupo para a aplicação se não existir
if ! id "www-data" &>/dev/null; then
    log "Criando usuário www-data..."
    useradd --system --home /var/www --shell /bin/false www-data
fi

# Criar diretório do projeto
log "Criando diretório do projeto..."
mkdir -p $PROJECT_DIR
mkdir -p /var/log/vibe-social
mkdir -p /var/www/certbot

# Definir permissões
chown -R www-data:www-data $PROJECT_DIR
chown -R www-data:www-data /var/log/vibe-social

# Verificar se o código já está no servidor
if [ ! -d "$PROJECT_DIR/frontend" ] || [ ! -d "$PROJECT_DIR/backend" ]; then
    warn "Código do projeto não encontrado em $PROJECT_DIR"
    echo ""
    echo "📋 Para continuar, você precisa:"
    echo "   1. Copiar o código do projeto para $PROJECT_DIR"
    echo "   2. Certificar-se que as pastas 'frontend' e 'backend' existem"
    echo ""
    echo "Exemplo:"
    echo "   git clone seu-repositorio.git $PROJECT_DIR"
    echo "   ou"
    echo "   scp -r ./codigo/* usuario@servidor:$PROJECT_DIR/"
    echo ""
    read -p "Pressione Enter depois de copiar o código ou Ctrl+C para cancelar..."
fi

# Verificar se as pastas existem agora
if [ ! -d "$PROJECT_DIR/frontend" ]; then
    error "Pasta frontend não encontrada em $PROJECT_DIR"
fi

if [ ! -d "$PROJECT_DIR/backend" ]; then
    error "Pasta backend não encontrada em $PROJECT_DIR"
fi

log "✅ Código encontrado no diretório do projeto"

# Copiar arquivos de configuração do nginx
log "Configurando nginx..."
mkdir -p /etc/nginx/sites-available
mkdir -p /etc/nginx/sites-enabled

# Backup da configuração atual
if [ -f /etc/nginx/nginx.conf ]; then
    cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup.$(date +%Y%m%d_%H%M%S)
fi

# Copiar configurações do nginx a partir do projeto
if [ -f "$PROJECT_DIR/nginx/nginx.conf" ]; then
    cp $PROJECT_DIR/nginx/nginx.conf /etc/nginx/nginx.conf
fi

if [ -f "$PROJECT_DIR/nginx/sites-available/meuvibe.com" ]; then
    cp $PROJECT_DIR/nginx/sites-available/meuvibe.com /etc/nginx/sites-available/
fi

# Remover site padrão
if [ -f /etc/nginx/sites-enabled/default ]; then
    rm /etc/nginx/sites-enabled/default
fi

# Instalar dependências do frontend
log "Instalando dependências do frontend..."
cd $PROJECT_DIR/frontend
sudo -u www-data npm install

# Instalar dependências do backend
log "Instalando dependências do backend..."
cd $PROJECT_DIR/backend
pip3 install -r requirements.txt

# Configurar serviços systemd
log "Configurando serviços systemd..."
if [ -f "$PROJECT_DIR/nginx/systemd/vibe-backend.service" ]; then
    cp $PROJECT_DIR/nginx/systemd/vibe-backend.service /etc/systemd/system/
fi

if [ -f "$PROJECT_DIR/nginx/systemd/vibe-frontend.service" ]; then
    cp $PROJECT_DIR/nginx/systemd/vibe-frontend.service /etc/systemd/system/
fi

# Reload systemd
systemctl daemon-reload

# Configurar nginx temporário para SSL
log "Configurando nginx temporário para obter SSL..."
cat > /etc/nginx/sites-available/meuvibe.com.temp << EOF
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN www.$DOMAIN;
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        return 200 'Configurando SSL...';
        add_header Content-Type text/plain;
    }
}
EOF

ln -sf /etc/nginx/sites-available/meuvibe.com.temp /etc/nginx/sites-enabled/meuvibe.com

# Testar e recarregar nginx
nginx -t && systemctl reload nginx

# Obter certificado SSL
log "Obtendo certificado SSL..."
echo ""
warn "⚠️  IMPORTANTE: Certifique-se de que os domínios $DOMAIN e www.$DOMAIN estão apontando para este servidor!"
echo ""
read -p "Pressione Enter para continuar ou Ctrl+C para cancelar..."

# Solicitar email se necessário
if [ "$EMAIL" == "seu-email@exemplo.com" ]; then
    read -p "Digite seu email para o certificado SSL: " EMAIL
fi

certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    -d $DOMAIN \
    -d www.$DOMAIN

# Verificar se o certificado foi criado
if [ ! -f /etc/letsencrypt/live/$DOMAIN/fullchain.pem ]; then
    error "Falha ao obter certificado SSL"
fi

log "✅ Certificado SSL obtido com sucesso"

# Ativar configuração final com SSL
log "Ativando configuração final do nginx..."
ln -sf /etc/nginx/sites-available/meuvibe.com /etc/nginx/sites-enabled/meuvibe.com

# Testar configuração final
nginx -t || error "Erro na configuração final do nginx"

# Iniciar serviços
log "Iniciando serviços..."

# Iniciar backend
systemctl enable vibe-backend
systemctl start vibe-backend

# Aguardar backend iniciar
sleep 5

# Iniciar frontend
systemctl enable vibe-frontend
systemctl start vibe-frontend

# Aguardar frontend iniciar
sleep 5

# Recarregar nginx
systemctl enable nginx
systemctl reload nginx

# Configurar renovação automática do SSL
log "Configurando renovação automática do SSL..."
(crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -

# Configurar firewall básico
log "Configurando firewall..."
if command_exists ufw; then
    ufw --force enable
    ufw allow ssh
    ufw allow 80
    ufw allow 443
    ufw reload
else
    warn "UFW não encontrado. Configure o firewall manualmente para permitir portas 22, 80 e 443"
fi

# Criar script de gerenciamento
log "Instalando script de gerenciamento..."
if [ -f "$PROJECT_DIR/nginx/manage-services.sh" ]; then
    cp $PROJECT_DIR/nginx/manage-services.sh /usr/local/bin/vibe-manage
    chmod +x /usr/local/bin/vibe-manage
fi

# Verificar status final
log "Verificando status dos serviços..."
sleep 3

echo ""
info "=== STATUS FINAL ==="

# Verificar backend
if systemctl is-active --quiet vibe-backend; then
    echo -e "${GREEN}✅ Backend: RODANDO${NC}"
else
    echo -e "${RED}❌ Backend: ERRO${NC}"
    systemctl status vibe-backend --no-pager -l
fi

# Verificar frontend
if systemctl is-active --quiet vibe-frontend; then
    echo -e "${GREEN}✅ Frontend: RODANDO${NC}"
else
    echo -e "${RED}❌ Frontend: ERRO${NC}"
    systemctl status vibe-frontend --no-pager -l
fi

# Verificar nginx
if systemctl is-active --quiet nginx; then
    echo -e "${GREEN}✅ Nginx: RODANDO${NC}"
else
    echo -e "${RED}❌ Nginx: ERRO${NC}"
    systemctl status nginx --no-pager -l
fi

echo ""
log "🎉 Deploy concluído!"
echo ""
echo "📋 Resumo da configuração:"
echo "   🌐 Site: https://$DOMAIN"
echo "   📱 Frontend: https://$DOMAIN (proxy para porta 4001)"
echo "   🔌 Backend API: https://$DOMAIN/api (proxy para porta 3010)"
echo "   📡 WebSocket: wss://$DOMAIN/ws"
echo "   📁 Uploads: https://$DOMAIN/uploads"
echo ""
echo "🔧 Comandos úteis:"
echo "   vibe-manage status                  # Ver status dos serviços"
echo "   vibe-manage restart all             # Reiniciar todos os serviços"
echo "   vibe-manage logs frontend           # Ver logs do frontend"
echo "   vibe-manage logs backend            # Ver logs do backend"
echo "   systemctl status vibe-backend       # Status detalhado do backend"
echo "   systemctl status vibe-frontend      # Status detalhado do frontend"
echo ""
echo "📝 Logs importantes:"
echo "   Backend: journalctl -u vibe-backend -f"
echo "   Frontend: journalctl -u vibe-frontend -f"
echo "   Nginx: tail -f /var/log/nginx/access.log"
echo "   Nginx Errors: tail -f /var/log/nginx/error.log"
echo ""
echo "🔒 SSL:"
echo "   Certificado: /etc/letsencrypt/live/$DOMAIN/fullchain.pem"
echo "   Renovação automática configurada"
echo ""

# Teste final
log "Testando conectividade..."
if curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN | grep -q "200\|301\|302"; then
    echo -e "${GREEN}✅ Site acessível em https://$DOMAIN${NC}"
else
    warn "⚠️  Site pode não estar respondendo corretamente"
    echo "   Verifique os logs: vibe-manage logs frontend"
fi

echo ""
info "Deploy finalizado! Acesse https://$DOMAIN para testar a aplicação."
