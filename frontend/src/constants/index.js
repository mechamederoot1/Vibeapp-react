// Configurações da aplicação
export const APP_CONFIG = {
  name: 'Vibe',
  description: 'Rede social moderna e responsiva',
  version: '1.0.0',
  author: 'Vibe Team',
}

// Configurações de API
export const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3010/api',
  timeout: 10000,
  maxRetries: 3,
}

// Configurações de mídia
export const MEDIA_CONFIG = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/heic', 'image/heif'],
  allowedVideoTypes: ['video/mp4'],
  maxVideoDuration: 60, // segundos
}

// Configurações de posts
export const POST_CONFIG = {
  maxCaptionLength: 500,
  maxHashtags: 10,
  maxMentions: 20,
}

// Configurações de perfil
export const PROFILE_CONFIG = {
  maxBioLength: 150,
  maxUsernameLength: 30,
  maxNameLength: 50,
}

// Configurações de notificações
export const NOTIFICATION_TYPES = {
  LIKE: 'like',
  COMMENT: 'comment',
  FOLLOW: 'follow',
  MENTION: 'mention',
  FRIEND_REQUEST: 'friend_request',
}

// Configurações de privacidade
export const PRIVACY_SETTINGS = {
  PUBLIC: 'public',
  FRIENDS: 'friends',
  PRIVATE: 'private',
}

// Mensagens de erro
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Erro de conexão. Verifique sua internet.',
  UNAUTHORIZED: 'Sessão expirada. Faça login novamente.',
  SERVER_ERROR: 'Erro interno do servidor. Tente novamente.',
  VALIDATION_ERROR: 'Dados inválidos. Verifique os campos.',
  FILE_TOO_LARGE: 'Arquivo muito grande. Máximo 10MB.',
  UNSUPPORTED_FILE: 'Tipo de arquivo não suportado.',
}

// Configurações de geolocalização
export const LOCATION_CONFIG = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 300000, // 5 minutos
}

// Configurações PWA
export const PWA_CONFIG = {
  updateAvailable: 'Nova versão disponível!',
  updateReady: 'Aplicativo atualizado. Reinicie para aplicar.',
  offline: 'Você está offline. Algumas funcionalidades podem não funcionar.',
  online: 'Conexão restaurada!',
}
