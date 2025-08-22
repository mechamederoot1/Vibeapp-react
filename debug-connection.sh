#!/bin/bash

# Script para diagnosticar problemas de conexão

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[✓] $1${NC}"
}

error() {
    echo -e "${RED}[✗] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[!] $1${NC}"
}

info() {
    echo -e "${BLUE}[i] $1${NC}"
}

echo "🔍 DIAGNÓSTICO DE CONEXÃO - VIBE SOCIAL"
echo "======================================"
echo ""

# 1. Verificar se os serviços estão rodando
info "1. Verificando status dos serviços..."
echo ""

# Backend
if systemctl is-active --quiet vibe-backend 2>/dev/null; then
    log "Backend (vibe-backend): RODANDO"
else
    error "Backend (vibe-backend): PARADO"
    echo "   Comando para iniciar: systemctl start vibe-backend"
fi

# Frontend
if systemctl is-active --quiet vibe-frontend 2>/dev/null; then
    log "Frontend (vibe-frontend): RODANDO"
else
    error "Frontend (vibe-frontend): PARADO"
    echo "   Comando para iniciar: systemctl start vibe-frontend"
fi

# Nginx
if systemctl is-active --quiet nginx 2>/dev/null; then
    log "Nginx: RODANDO"
else
    error "Nginx: PARADO"
    echo "   Comando para iniciar: systemctl start nginx"
fi

echo ""

# 2. Verificar portas
info "2. Verificando portas..."
echo ""

# Porta 3010 (Backend)
if netstat -tlnp 2>/dev/null | grep -q ":3010"; then
    log "Porta 3010 (Backend): ATIVA"
    netstat -tlnp 2>/dev/null | grep ":3010"
else
    error "Porta 3010 (Backend): NÃO ATIVA"
fi

# Porta 4001 (Frontend)
if netstat -tlnp 2>/dev/null | grep -q ":4001"; then
    log "Porta 4001 (Frontend): ATIVA"
    netstat -tlnp 2>/dev/null | grep ":4001"
else
    error "Porta 4001 (Frontend): NÃO ATIVA"
fi

# Porta 80 (HTTP)
if netstat -tlnp 2>/dev/null | grep -q ":80"; then
    log "Porta 80 (HTTP): ATIVA"
else
    error "Porta 80 (HTTP): NÃO ATIVA"
fi

# Porta 443 (HTTPS)
if netstat -tlnp 2>/dev/null | grep -q ":443"; then
    log "Porta 443 (HTTPS): ATIVA"
else
    error "Porta 443 (HTTPS): NÃO ATIVA"
fi

echo ""

# 3. Testar conectividade
info "3. Testando conectividade..."
echo ""

# Teste local do backend
echo -n "Backend local (localhost:3010): "
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3010/api/health 2>/dev/null | grep -q "200"; then
    log "OK"
else
    error "FALHA"
fi

# Teste local do frontend
echo -n "Frontend local (localhost:4001): "
if curl -s -o /dev/null -w "%{http_code}" http://localhost:4001 2>/dev/null | grep -q "200"; then
    log "OK"
else
    error "FALHA"
fi

# Teste externo HTTPS
echo -n "Site externo (https://meuvibe.com): "
if curl -s -o /dev/null -w "%{http_code}" https://meuvibe.com 2>/dev/null | grep -q "200"; then
    log "OK"
else
    error "FALHA"
fi

# Teste API externa
echo -n "API externa (https://meuvibe.com/api/health): "
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://meuvibe.com/api/health 2>/dev/null)
if echo "$HTTP_CODE" | grep -q "200"; then
    log "OK (HTTP $HTTP_CODE)"
else
    error "FALHA (HTTP $HTTP_CODE)"
fi

echo ""

# 4. Verificar configuração do nginx
info "4. Verificando configuração do nginx..."
echo ""

if nginx -t 2>/dev/null; then
    log "Configuração do nginx: VÁLIDA"
else
    error "Configuração do nginx: INVÁLIDA"
    echo "   Execute: nginx -t para ver os erros"
fi

echo ""

# 5. Verificar SSL
info "5. Verificando certificado SSL..."
echo ""

if [ -f /etc/letsencrypt/live/meuvibe.com/fullchain.pem ]; then
    log "Certificado SSL: ENCONTRADO"
    EXPIRY=$(openssl x509 -enddate -noout -in /etc/letsencrypt/live/meuvibe.com/fullchain.pem 2>/dev/null | cut -d= -f2)
    echo "   Expira em: $EXPIRY"
else
    error "Certificado SSL: NÃO ENCONTRADO"
    echo "   Execute: certbot certificates para verificar"
fi

echo ""

# 6. Verificar logs recentes
info "6. Logs recentes (últimas 5 linhas)..."
echo ""

echo "Backend:"
journalctl -u vibe-backend --no-pager -n 5 2>/dev/null || echo "   Logs não disponíveis"

echo ""
echo "Frontend:"
journalctl -u vibe-frontend --no-pager -n 5 2>/dev/null || echo "   Logs não disponíveis"

echo ""
echo "Nginx (errors):"
tail -n 5 /var/log/nginx/error.log 2>/dev/null || echo "   Logs não disponíveis"

echo ""

# 7. Comandos úteis
info "7. Comandos úteis para debug:"
echo ""
echo "   Ver logs em tempo real:"
echo "   • Backend:  journalctl -f -u vibe-backend"
echo "   • Frontend: journalctl -f -u vibe-frontend"
echo "   • Nginx:    tail -f /var/log/nginx/error.log"
echo ""
echo "   Reiniciar serviços:"
echo "   • systemctl restart vibe-backend"
echo "   • systemctl restart vibe-frontend"
echo "   • systemctl restart nginx"
echo ""
echo "   Testar conectividade:"
echo "   • curl -v https://meuvibe.com/api/health"
echo "   • curl -v http://localhost:3010/api/health"
echo "   • curl -v http://localhost:4001"

echo ""
echo "🔍 Diagnóstico concluído!"
