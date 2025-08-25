# 📱 Guia de Configuração Mobile - Capacitor

## ✅ Capacitor Instalado e Configurado

O Capacitor foi instalado e configurado com sucesso no projeto Vibe Social!

### 📦 O que foi instalado:
- **@capacitor/core** - Core do Capacitor
- **@capacitor/cli** - CLI do Capacitor  
- **@capacitor/android** - Plugin para Android
- **@capacitor/ios** - Plugin para iOS

### 📂 Estrutura criada:
```
frontend/
├── android/          # Projeto Android nativo
├── ios/             # Projeto iOS nativo
├── capacitor.config.json
└── dist/            # Build da aplicação web
```

## 🚀 Como usar

### Scripts disponíveis:

**No diretório principal:**
```bash
npm run build:mobile   # Build + sync das plataformas
npm run android        # Abre projeto Android no Android Studio
npm run ios           # Abre projeto iOS no Xcode  
npm run sync          # Sincroniza mudanças com as plataformas
```

**No diretório frontend:**
```bash
npm run build:mobile   # Build + sync das plataformas
npm run android        # Build + abre Android Studio
npm run ios           # Build + abre Xcode
npm run sync          # Sincroniza com plataformas
npm run copy          # Apenas copia arquivos
```

### 📱 Para gerar APK (Android):

1. **Build e abrir Android Studio:**
   ```bash
   npm run android
   ```

2. **No Android Studio:**
   - Aguarde o projeto carregar
   - Vá em `Build > Generate Signed Bundle / APK`
   - Escolha `APK`
   - Configure assinatura (ou use debug)
   - Build será gerado em `android/app/build/outputs/apk/`

### 🍎 Para gerar IPA (iOS):

1. **Build e abrir Xcode:**
   ```bash
   npm run ios
   ```

2. **No Xcode:**
   - Aguarde o projeto carregar
   - Configure o Bundle Identifier
   - Conecte dispositivo ou use simulador
   - `Product > Archive` para release

## ⚙️ Configuração

### Arquivo `capacitor.config.json`:
```json
{
  "appId": "com.vibe.social",
  "appName": "Vibe Social", 
  "webDir": "dist"
}
```

### 🔄 Workflow de desenvolvimento:

1. **Desenvolvimento web normal:**
   ```bash
   npm run dev
   ```

2. **Teste em mobile após mudanças:**
   ```bash
   npm run build:mobile  # Build + sync
   npm run android       # Testa no Android
   ```

3. **Apenas sincronizar mudanças:**
   ```bash
   npm run sync
   ```

## 📋 Pré-requisitos para build mobile:

### Android:
- Android Studio instalado
- Android SDK configurado
- Java JDK 8+

### iOS (apenas macOS):
- Xcode instalado
- CocoaPods (`sudo gem install cocoapods`)
- Conta de desenvolvedor Apple (para distribuição)

## 🎯 Próximos passos:

1. **Personalizar ícone e splash screen**
2. **Configurar permissões nativas**
3. **Adicionar plugins do Capacitor conforme necessário**
4. **Configurar build automático para CI/CD**

---

**✅ Setup completo!** O Vibe Social agora pode ser compilado como app nativo para Android e iOS.
