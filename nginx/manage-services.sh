#!/bin/bash

# Script para gerenciar os serviços do Vibe Social
# Frontend (porta 4001) e Backend (porta 3010)

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Diretórios do projeto
PROJECT_DIR="/opt/vibe-social"
FRONTEND_DIR="$PROJECT_DIR/frontend"
BACKEND_DIR="$PROJECT_DIR/backend"

# Função para log
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

# Função para verificar se um processo está rodando em uma porta
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Função para iniciar o frontend
start_frontend() {
    log "Iniciando frontend na porta 4001..."
    
    if check_port 4001; then
        warn "Porta 4001 já está em uso"
        return 1
    fi
    
    cd "$FRONTEND_DIR"
    
    # Verificar se node_modules existe
    if [ ! -d "node_modules" ]; then
        log "Instalando dependências do frontend..."
        npm install
    fi
    
    # Iniciar em background
    nohup npm run dev > /var/log/vibe-frontend.log 2>&1 &
    echo $! > /var/run/vibe-frontend.pid
    
    sleep 3
    
    if check_port 4001; then
        log "✅ Frontend iniciado com sucesso na porta 4001"
        return 0
    else
        error "❌ Falha ao iniciar frontend"
        return 1
    fi
}

# Função para iniciar o backend
start_backend() {
    log "Iniciando backend na porta 3010..."
    
    if check_port 3010; then
        warn "Porta 3010 já está em uso"
        return 1
    fi
    
    cd "$BACKEND_DIR"
    
    # Verificar se as dependências estão instaladas
    if ! python3 -c "import fastapi" 2>/dev/null; then
        log "Instalando dependências do backend..."
        pip3 install -r requirements.txt
    fi
    
    # Iniciar em background
    nohup python3 main.py > /var/log/vibe-backend.log 2>&1 &
    echo $! > /var/run/vibe-backend.pid
    
    sleep 3
    
    if check_port 3010; then
        log "✅ Backend iniciado com sucesso na porta 3010"
        return 0
    else
        error "❌ Falha ao iniciar backend"
        return 1
    fi
}

# Função para parar o frontend
stop_frontend() {
    log "Parando frontend..."
    
    if [ -f /var/run/vibe-frontend.pid ]; then
        local pid=$(cat /var/run/vibe-frontend.pid)
        if kill -0 $pid 2>/dev/null; then
            kill $pid
            rm /var/run/vibe-frontend.pid
            log "✅ Frontend parado"
        else
            warn "Processo do frontend não encontrado"
            rm -f /var/run/vibe-frontend.pid
        fi
    else
        warn "PID do frontend não encontrado"
    fi
    
    # Forçar parada se ainda estiver rodando
    if check_port 4001; then
        local pid=$(lsof -Pi :4001 -sTCP:LISTEN -t)
        if [ ! -z "$pid" ]; then
            kill -9 $pid
            log "✅ Frontend forçadamente parado"
        fi
    fi
}

# Função para parar o backend
stop_backend() {
    log "Parando backend..."
    
    if [ -f /var/run/vibe-backend.pid ]; then
        local pid=$(cat /var/run/vibe-backend.pid)
        if kill -0 $pid 2>/dev/null; then
            kill $pid
            rm /var/run/vibe-backend.pid
            log "✅ Backend parado"
        else
            warn "Processo do backend não encontrado"
            rm -f /var/run/vibe-backend.pid
        fi
    else
        warn "PID do backend não encontrado"
    fi
    
    # Forçar parada se ainda estiver rodando
    if check_port 3010; then
        local pid=$(lsof -Pi :3010 -sTCP:LISTEN -t)
        if [ ! -z "$pid" ]; then
            kill -9 $pid
            log "✅ Backend forçadamente parado"
        fi
    fi
}

# Função para verificar status
status() {
    echo ""
    info "=== STATUS DOS SERVIÇOS ==="
    
    # Frontend
    if check_port 4001; then
        echo -e "${GREEN}✅ Frontend: RODANDO (porta 4001)${NC}"
    else
        echo -e "${RED}❌ Frontend: PARADO${NC}"
    fi
    
    # Backend
    if check_port 3010; then
        echo -e "${GREEN}✅ Backend: RODANDO (porta 3010)${NC}"
    else
        echo -e "${RED}❌ Backend: PARADO${NC}"
    fi
    
    # Nginx
    if systemctl is-active --quiet nginx; then
        echo -e "${GREEN}✅ Nginx: RODANDO${NC}"
    else
        echo -e "${RED}❌ Nginx: PARADO${NC}"
    fi
    
    echo ""
    info "=== PORTAS EM USO ==="
    netstat -tlnp | grep -E ':4001|:3010|:80|:443' | while read line; do
        echo "  $line"
    done
    echo ""
}

# Função para mostrar logs
logs() {
    local service=$1
    
    case $service in
        frontend|front)
            log "Mostrando logs do frontend..."
            tail -f /var/log/vibe-frontend.log
            ;;
        backend|back)
            log "Mostrando logs do backend..."
            tail -f /var/log/vibe-backend.log
            ;;
        nginx)
            log "Mostrando logs do nginx..."
            tail -f /var/log/nginx/access.log
            ;;
        nginx-error)
            log "Mostrando logs de erro do nginx..."
            tail -f /var/log/nginx/error.log
            ;;
        *)
            error "Serviço inválido. Use: frontend, backend, nginx, nginx-error"
            ;;
    esac
}

# Função principal
main() {
    case $1 in
        start)
            case $2 in
                frontend|front)
                    start_frontend
                    ;;
                backend|back)
                    start_backend
                    ;;
                all|"")
                    start_backend
                    start_frontend
                    ;;
                *)
                    error "Uso: $0 start [frontend|backend|all]"
                    ;;
            esac
            ;;
        stop)
            case $2 in
                frontend|front)
                    stop_frontend
                    ;;
                backend|back)
                    stop_backend
                    ;;
                all|"")
                    stop_frontend
                    stop_backend
                    ;;
                *)
                    error "Uso: $0 stop [frontend|backend|all]"
                    ;;
            esac
            ;;
        restart)
            case $2 in
                frontend|front)
                    stop_frontend
                    sleep 2
                    start_frontend
                    ;;
                backend|back)
                    stop_backend
                    sleep 2
                    start_backend
                    ;;
                all|"")
                    stop_frontend
                    stop_backend
                    sleep 2
                    start_backend
                    start_frontend
                    ;;
                *)
                    error "Uso: $0 restart [frontend|backend|all]"
                    ;;
            esac
            ;;
        status)
            status
            ;;
        logs)
            logs $2
            ;;
        *)
            echo ""
            info "=== GERENCIADOR DE SERVIÇOS VIBE SOCIAL ==="
            echo ""
            echo "Uso: $0 {start|stop|restart|status|logs} [serviço]"
            echo ""
            echo "Comandos:"
            echo "  start [frontend|backend|all]    - Iniciar serviços"
            echo "  stop [frontend|backend|all]     - Parar serviços"
            echo "  restart [frontend|backend|all]  - Reiniciar serviços"
            echo "  status                           - Ver status dos serviços"
            echo "  logs [frontend|backend|nginx|nginx-error] - Ver logs"
            echo ""
            echo "Exemplos:"
            echo "  $0 start all          # Iniciar todos os serviços"
            echo "  $0 restart frontend   # Reiniciar apenas o frontend"
            echo "  $0 logs backend       # Ver logs do backend"
            echo "  $0 status             # Ver status de todos os serviços"
            echo ""
            ;;
    esac
}

# Verificar se está rodando como root para algumas operações
if [[ $EUID -ne 0 ]] && [[ $1 == "start" || $1 == "stop" || $1 == "restart" ]]; then
   warn "Algumas operações podem necessitar privilégios de root"
fi

main "$@"
