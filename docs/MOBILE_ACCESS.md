# 📱 Acesso via Celular - Vibe Social

## 🚀 Como iniciar a aplicação

### 1. Instalar dependências do backend
```bash
cd backend
pip install -r requirements.txt
```

### 2. Iniciar o backend
```bash
cd backend
python main.py
```
> Backend estará rodando em: `http://SEU_IP:8000`

### 3. Instalar dependências do frontend
```bash
cd frontend
npm install
```

### 4. Iniciar o frontend
```bash
cd frontend
npm run dev
```
> Frontend estará rodando em: `http://SEU_IP:3000`

## 📱 Descobrindo seu IP local

### No Windows:
```bash
ipconfig
```
Procure por "IPv4 Address" na seção da sua rede.

### No Mac/Linux:
```bash
ifconfig
```
ou
```bash
hostname -I
```

### Exemplo:
Se seu IP for `192.168.1.100`, acesse no celular:
- **Frontend:** `http://192.168.1.100:3000`
- **Backend API:** `http://192.168.1.100:8000`

## 🔧 Configurações já prontas

✅ **Frontend (Vite):** Configurado para aceitar conexões externas
✅ **Backend (FastAPI):** Configurado para aceitar conexões externas  
✅ **CORS:** Configurado para permitir qualquer origem
✅ **PWA:** Pronto para instalação no celular

## 📋 Checklist para funcionar

- [ ] Computador e celular na mesma rede WiFi
- [ ] Backend rodando em `0.0.0.0:8000`
- [ ] Frontend rodando em `0.0.0.0:3000`
- [ ] Firewall permite conexões nas portas 3000 e 8000
- [ ] IP local descoberto corretamente

## 🎯 Testando

1. **Abra no computador:** `http://localhost:3000`
2. **Abra no celular:** `http://SEU_IP:3000`
3. **Crie uma conta** e teste as funcionalidades
4. **Instale como PWA** no celular (opção no navegador)

## 🐛 Resolução de problemas

### Não consegue acessar do celular:
1. Verifique se ambos estão na mesma rede
2. Teste ping do celular para o computador
3. Desative temporariamente o firewall
4. Use IP correto (não localhost)

### API não funciona:
1. Verifique se backend está rodando
2. Teste `http://SEU_IP:8000/api/health`
3. Verifique logs do backend no terminal

### Funcionalidades disponíveis:
- ✅ Registro e login de usuários
- ✅ Criação de posts (texto, imagem, vídeo)
- ✅ Feed com posts reais
- ✅ Sistema de curtidas
- ✅ Edição de perfil
- ✅ Upload de fotos
- ✅ Interface responsiva para mobile
