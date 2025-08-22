#!/bin/bash

# Script para fazer build do frontend para produção
# Execute este no seu VPS após fazer git pull

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

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

log "🔄 Fazendo build do frontend para produção..."

# Ir para o diretório do frontend
cd frontend

# Limpar cache e node_modules se necessário
if [ "$1" == "--clean" ]; then
    log "🧹 Limpando cache..."
    rm -rf node_modules package-lock.json
    npm cache clean --force
fi

# Instalar dependências
log "📦 Instalando dependências..."
npm install

# Fazer build para produção
log "🏗️ Fazendo build..."
npm run build

# Verificar se o build foi criado
if [ ! -d "dist" ]; then
    error "Build falhou - diretório dist não encontrado"
fi

log "✅ Build concluído com sucesso!"

# Copiar arquivos de build para nginx (se necessário)
if [ -d "/var/www/html" ]; then
    log "📋 Copiando arquivos para nginx..."
    sudo cp -r dist/* /var/www/html/
    log "✅ Arquivos copiados para nginx"
fi

log "🎉 Frontend pronto para produção!"
echo ""
echo "📝 Próximos passos:"
echo "   1. Verificar se o backend está rodando: systemctl status vibe-backend"
echo "   2. Verificar se o nginx está funcionando: systemctl status nginx"
echo "   3. Testar a API: curl https://meuvibe.com/api/health"
echo "   4. Ver logs em tempo real: journalctl -f -u vibe-frontend"
