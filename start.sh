#!/bin/bash

# Vibe Social - Startup Script
echo "🚀 Iniciando Vibe Social..."

# Descobrir IP local
if [[ "$OSTYPE" == "linux-gnu"* ]] || [[ "$OSTYPE" == "darwin"* ]]; then
    # Linux/Mac
    LOCAL_IP=$(hostname -I | awk '{print $1}' 2>/dev/null || ifconfig | grep -E 'inet.*broadcast' | awk '{print $2}' | head -1)
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
    # Windows (Git Bash)
    LOCAL_IP=$(ipconfig | grep "IPv4" | head -1 | awk '{print $NF}')
else
    LOCAL_IP="localhost"
fi

echo "📍 IP Local detectado: $LOCAL_IP"
echo ""
echo "📱 Acesso via celular:"
echo "   Frontend: http://$LOCAL_IP:3000"
echo "   Backend:  http://$LOCAL_IP:8000"
echo ""

# Verificar se as dependências estão instaladas
if [ ! -d "backend/venv" ] && [ ! -f "backend/.env" ]; then
    echo "⚠️  Primeira execução detectada!"
    echo "📦 Instalando dependências do backend..."
    cd backend
    pip install -r requirements.txt
    cd ..
fi

if [ ! -d "frontend/node_modules" ]; then
    echo "📦 Instalando dependências do frontend..."
    cd frontend
    npm install
    cd ..
fi

echo ""
echo "🔥 Iniciando serviços..."

# Iniciar backend em background
echo "🐍 Iniciando backend (Python/FastAPI)..."
cd backend
python main.py &
BACKEND_PID=$!
cd ..

# Aguardar um momento para o backend iniciar
sleep 3

# Iniciar frontend
echo "⚛️  Iniciando frontend (React/Vite)..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ Aplicação iniciada com sucesso!"
echo ""
echo "🌐 Acessos disponíveis:"
echo "   💻 Computador: http://localhost:3000"
echo "   📱 Celular:    http://$LOCAL_IP:3000"
echo ""
echo "📚 Funcionalidades disponíveis:"
echo "   ✅ Registro e login"
echo "   ✅ Criação de posts (texto, imagem, vídeo)"
echo "   ✅ Feed interativo"
echo "   ✅ Sistema de curtidas"
echo "   ✅ Perfil de usuário"
echo "   ✅ Interface mobile responsiva"
echo ""
echo "⏹️  Para parar: Ctrl+C"

# Função para limpar processos ao sair
cleanup() {
    echo ""
    echo "🛑 Parando aplicação..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 0
}

# Capturar Ctrl+C
trap cleanup SIGINT

# Manter script rodando
wait
