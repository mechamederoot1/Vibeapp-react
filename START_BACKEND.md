# 🚀 Como Executar o Backend

## Opção 1: Script Python
```bash
python3 start_backend.py
```

## Opção 2: Manual
```bash
cd backend
python3 main.py
```

## Verificar se está funcionando
- Backend: http://localhost:8000
- API Docs: http://localhost:8000/docs
- Health Check: http://localhost:8000/api/health

## Problemas Comuns

### ❌ "python não encontrado"
**Solução:** Use `python3` em vez de `python`

### ❌ "Módulo não encontrado"
**Solução:** Instale as dependências:
```bash
cd backend
pip3 install -r requirements.txt
```

### ❌ "Porta 8000 em uso"
**Solução:** Mate o processo:
```bash
# Linux/Mac
lsof -ti:8000 | xargs kill -9

# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

## Status da API
O frontend agora detecta automaticamente problemas de conectividade e oferece um testador de API integrado.

---
**✅ Quando o backend estiver rodando, as imagens e o feed funcionarão corretamente!**
