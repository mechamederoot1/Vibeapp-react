#!/bin/bash

echo "🔧 Instalando dependências para Azure MySQL..."

# Instalar dependências
pip install PyMySQL==1.1.0
pip install cryptography==41.0.8

echo "✅ Dependências instaladas!"

echo ""
echo "📝 Próximos passos:"
echo "1. Execute: python test_connection.py"
echo "2. Execute: python setup_azure_database.py"
echo "3. Execute: python main.py"
