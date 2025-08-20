import axios from 'axios'

// Configuração base da API
const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL
  }

  // Detecta o IP da rede automaticamente
  const hostname = window.location.hostname

  // Se estiver acessando por localhost, usa localhost para API também
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:8000/api'
  }

  // Se estiver acessando por IP da rede, usa o mesmo IP para a API
  if (hostname.match(/^\d+\.\d+\.\d+\.\d+$/)) {
    return `http://${hostname}:8000/api`
  }

  // Para outros casos, assume localhost
  return 'http://localhost:8000/api'
}

const API_BASE_URL = getApiBaseUrl()
console.log('🔧 API Base URL detectada:', API_BASE_URL)
console.log('🌐 Hostname atual:', window.location.hostname)

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Create special instance for uploads with longer timeout
const uploadApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000, // 2 minutes for uploads
  headers: {
    'Content-Type': 'application/json',
  },
})

// Function to add interceptors
const addInterceptors = (apiInstance) => {
  // Interceptor para adicionar token de autenticação
  apiInstance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
        console.log(`🔑 Adding auth token to ${config.method?.toUpperCase()} ${config.url}`)
      } else {
        console.log(`⚠️  No token found for ${config.method?.toUpperCase()} ${config.url}`)
      }
      return config
    },
    (error) => {
      console.error('❌ Request interceptor error:', error)
      return Promise.reject(error)
    }
  )

  // Interceptor para tratar respostas
  apiInstance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        localStorage.removeItem('token')
        window.location.href = '/login'
      }
      return Promise.reject(error)
    }
  )
}

// Add interceptors to both instances
addInterceptors(api)
addInterceptors(uploadApi)

// Demo authentication functions for Builder.io environment
const createDemoAuthResponse = (userData) => {
  const user = {
    id: Date.now(),
    email: userData?.email || 'demo@example.com',
    firstName: userData?.firstName || 'Demo',
    lastName: userData?.lastName || 'User',
    fullName: `${userData?.firstName || 'Demo'} ${userData?.lastName || 'User'}`,
    username: userData?.email?.split('@')[0] || 'demo_user',
    bio: 'Usuário demo - Bem-vindo ao Vibe Social! ✨',
    avatar: null,
    coverPhoto: null,
    isVerified: false,
    isActive: true,
    createdAt: new Date().toISOString(),
    birthDate: userData?.birthDate || null,
    gender: userData?.gender || null
  }

  return {
    data: {
      access_token: 'demo_token_' + Date.now(),
      token_type: 'bearer',
      user
    }
  }
}

// Auth endpoints with Builder.io demo mode support
export const authAPI = {
  login: async (email, password) => {
    if (!API_BASE_URL) {
      console.log('🎭 Modo demo - Login simulado')
      await new Promise(resolve => setTimeout(resolve, 1000))
      return createDemoAuthResponse({ email })
    }
    return api.post('/auth/login', { email, password })
  },

  register: async (userData) => {
    if (!API_BASE_URL) {
      console.log('🎭 Modo demo - Registro simulado')
      await new Promise(resolve => setTimeout(resolve, 1500))
      return createDemoAuthResponse(userData)
    }
    return api.post('/auth/register', userData)
  },

  me: async () => {
    if (!API_BASE_URL) {
      console.log('🎭 Modo demo - Perfil simulado')
      const token = localStorage.getItem('token')
      if (!token || !token.startsWith('demo_token_')) {
        throw new Error('Not authenticated')
      }
      return createDemoAuthResponse()
    }
    return api.get('/auth/me')
  },

  logout: async () => {
    if (!API_BASE_URL) {
      console.log('🎭 Modo demo - Logout simulado')
      return { data: { message: 'Logout successful' } }
    }
    return api.post('/auth/logout')
  },

  createDemoUser: async () => {
    if (!API_BASE_URL) {
      console.log('🎭 Modo demo - Demo user criado')
      return createDemoAuthResponse({
        email: 'demo@vibesocial.com',
        firstName: 'Demo',
        lastName: 'User'
      })
    }
    return api.post('/auth/create-demo-user')
  }
}

// Users endpoints with demo mode support
export const usersAPI = {
  getProfile: async () => {
    if (!API_BASE_URL) {
      const token = localStorage.getItem('token')
      if (!token) throw new Error('Not authenticated')
      return createDemoAuthResponse()
    }
    return api.get('/users/profile')
  },

  updateProfile: async (userData) => {
    if (!API_BASE_URL) {
      console.log('🎭 Modo demo - Perfil atualizado')
      await new Promise(resolve => setTimeout(resolve, 1000))
      return createDemoAuthResponse(userData)
    }
    return api.put('/users/profile', userData)
  },

  getUserById: async (userId) => {
    if (!API_BASE_URL) {
      return createDemoAuthResponse()
    }
    return api.get(`/users/${userId}`)
  },

  getUserStats: async (userId) => {
    if (!API_BASE_URL) {
      return {
        data: {
          followersCount: 0,
          followingCount: 0,
          postsCount: 0,
          profileViewsCount: 0,
          friendsCount: 0
        }
      }
    }
    return api.get(`/users/${userId}/stats`)
  },

  getProfileVisitors: async (userId, limit = 10) => {
    if (!API_BASE_URL) {
      return { data: [] }
    }
    return api.get(`/users/${userId}/visitors?limit=${limit}`)
  },

  searchUsers: async (query, limit = 20) => {
    if (!API_BASE_URL) {
      return { data: [] }
    }
    return api.get(`/users/search?q=${query}&limit=${limit}`)
  }
}

// Posts endpoints
export const postsAPI = {
  getFeed: (page = 1, limit = 20) => api.get(`/posts/feed?page=${page}&limit=${limit}`),
  createPost: (postData) => api.post('/posts/', postData),
  getPost: (postId) => api.get(`/posts/${postId}`),
  likePost: (postId) => api.post(`/posts/${postId}/like`),
  sharePost: (postId) => api.post(`/posts/${postId}/share`),
  repostPost: (postId) => api.post(`/posts/${postId}/repost`),
  getComments: (postId, page = 1, limit = 20) => api.get(`/posts/${postId}/comments?page=${page}&limit=${limit}`),
  createComment: (postId, content) => api.post(`/posts/${postId}/comments`, { content }),
  deletePost: (postId) => api.delete(`/posts/${postId}`),
  getUserPosts: (userId, page = 1, limit = 20) => api.get(`/posts/user/${userId}?page=${page}&limit=${limit}`)
}

// Uploads endpoints
export const uploadsAPI = {
  uploadAvatar: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return uploadApi.post('/uploads/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },
  uploadCover: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return uploadApi.post('/uploads/cover', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },
  removeAvatar: () => api.delete('/uploads/avatar'),
  removeCover: () => api.delete('/uploads/cover'),
  uploadStoryMedia: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return uploadApi.post('/uploads/story-media', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },
}

// Stories endpoints
export const storiesAPI = {
  getStories: (limit = 20) => api.get(`/stories/?limit=${limit}`),
  createStory: (storyData) => api.post('/stories/', storyData),
  getStory: (storyId) => api.get(`/stories/${storyId}`),
  getStoryViews: (storyId, limit = 50) => api.get(`/stories/${storyId}/views?limit=${limit}`),
  deleteStory: (storyId) => api.delete(`/stories/${storyId}`),
  getUserStories: (userId, limit = 10) => api.get(`/stories/user/${userId}?limit=${limit}`),
}

// Friendships endpoints
export const friendshipsAPI = {
  sendFriendRequest: (friendId) => api.post('/friendships/requests', { friend_id: friendId }),
  getReceivedRequests: () => api.get('/friendships/requests/received'),
  getSentRequests: () => api.get('/friendships/requests/sent'),
  acceptFriendRequest: (friendshipId) => api.put(`/friendships/requests/${friendshipId}/accept`),
  rejectFriendRequest: (friendshipId) => api.put(`/friendships/requests/${friendshipId}/reject`),
  removeFriend: (userId) => api.delete(`/friendships/users/${userId}`),
  getUserFriends: (userId, limit = 50) => api.get(`/friendships/users/${userId}/friends?limit=${limit}`),
  getFriendshipStatus: (userId) => api.get(`/friendships/users/${userId}/friendship-status`)
}

// Personal Info endpoints
export const personalInfoAPI = {
  get: (userId = null) => {
    const url = userId ? `/personal-info?user_id=${userId}` : '/personal-info'
    return api.get(url)
  },
  update: (data) => api.put('/personal-info', data),
  delete: () => api.delete('/personal-info'),
  updatePrivacy: (privacy) => api.put('/personal-info/privacy', privacy)
}

// Highlights endpoints
export const highlightsAPI = {
  get: (userId = null) => {
    const url = userId ? `/highlights?user_id=${userId}` : '/highlights'
    return api.get(url)
  },
  getDetails: (highlightId) => api.get(`/highlights/${highlightId}`),
  create: (data) => api.post('/highlights', data),
  update: (highlightId, data) => api.put(`/highlights/${highlightId}`, data),
  delete: (highlightId) => api.delete(`/highlights/${highlightId}`),
  addStory: (highlightId, storyId, orderIndex = null) => api.post(`/highlights/${highlightId}/stories`, {
    storyId,
    orderIndex
  }),
  removeStory: (highlightId, storyId) => api.delete(`/highlights/${highlightId}/stories/${storyId}`),
  getStories: (highlightId) => api.get(`/highlights/${highlightId}/stories`)
}

// Development endpoints
export const devAPI = {
  createTestUsers: () => api.post('/dev/create-test-users'),
  listTestUsers: () => api.get('/dev/test-users'),
  migrateDatabase: () => api.post('/dev/migrate-database'),
}

// Legacy services for backward compatibility
export const authService = {
  login: (credentials) => authAPI.login(credentials.email, credentials.password),
  register: (userData) => authAPI.register(userData),
  logout: () => authAPI.logout(),
}

export const userService = {
  getProfile: (userId) => usersAPI.getUserById(userId),
  updateProfile: (userId, data) => usersAPI.updateProfile(data),
  getProfileVisitors: (userId) => usersAPI.getProfileVisitors(userId),
  getFriends: (userId) => friendshipsAPI.getUserFriends(userId),
}

export const postService = {
  getFeed: (page = 1) => postsAPI.getFeed(page),
  createPost: (postData) => postsAPI.createPost(postData),
  likePost: (postId) => postsAPI.likePost(postId),
  getComments: (postId) => postsAPI.getComments(postId),
  addComment: (postId, comment) => postsAPI.createComment(postId, comment.content),
}

export { api }
export default api
