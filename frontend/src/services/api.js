import axios from 'axios'

// Detecta se está rodando no Builder.io
const isBuilderEnvironment = () => {
  const hostname = window.location.hostname
  return hostname.includes('fly.dev') || hostname.includes('builder.io') || hostname.includes('netlify.app')
}

// Configuração base da API
const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL
  }

  // Se está no Builder.io ou ambiente de produção, não tenta conectar backend local
  if (isBuilderEnvironment()) {
    console.log('🌐 Detectado ambiente Builder.io - usando modo demo')
    return null // Indica que deve usar modo demo
  }

  // Em desenvolvimento local, usa localhost
  if (import.meta.env.DEV && window.location.hostname === 'localhost') {
    return 'http://localhost:8000/api'
  }

  // Para rede local (ex: 192.168.x.x)
  const hostname = window.location.hostname
  return `http://${hostname}:8000/api`
}

const API_BASE_URL = getApiBaseUrl()
console.log('🔧 API Base URL:', API_BASE_URL)
console.log('🌐 Ambiente Builder.io:', isBuilderEnvironment())
if (!API_BASE_URL) {
  console.log('📦 MODO DEMO ATIVADO: Usando localStorage como banco de dados')
}

// Cria instância da API apenas se não estiver no modo demo
const api = API_BASE_URL ? axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
}) : null

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

// Auth endpoints
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (userData) => api.post('/auth/register', userData),
  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
  createDemoUser: () => api.post('/auth/create-demo-user')
}

// Users endpoints
export const usersAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (userData) => api.put('/users/profile', userData),
  getUserById: (userId) => api.get(`/users/${userId}`),
  getUserStats: (userId) => api.get(`/users/${userId}/stats`),
  getProfileVisitors: (userId, limit = 10) => api.get(`/users/${userId}/visitors?limit=${limit}`),
  searchUsers: (query, limit = 20) => api.get(`/users/search?q=${query}&limit=${limit}`)
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

// Work Experience endpoints
export const workExperienceAPI = {
  getAll: () => api.get('/work-experience'),
  create: (workData) => api.post('/work-experience', workData),
  update: (id, workData) => api.put(`/work-experience/${id}`, workData),
  delete: (id) => api.delete(`/work-experience/${id}`)
}

// Education endpoints
export const educationAPI = {
  getAll: () => {
    if (!api) {
      const educationEntries = JSON.parse(localStorage.getItem('educationEntries') || '[]')
      return Promise.resolve({ data: educationEntries })
    }
    return api.get('/education')
  },
  create: (educationData) => {
    if (!api) {
      const educationEntries = JSON.parse(localStorage.getItem('educationEntries') || '[]')
      const newEducation = { ...educationData, id: Date.now(), displayText: `${educationData.degree} - ${educationData.institution}` }
      educationEntries.push(newEducation)
      localStorage.setItem('educationEntries', JSON.stringify(educationEntries))
      return Promise.resolve({ data: newEducation })
    }
    return api.post('/education', educationData)
  },
  update: (id, educationData) => {
    if (!api) {
      const educationEntries = JSON.parse(localStorage.getItem('educationEntries') || '[]')
      const index = educationEntries.findIndex(e => e.id == id)
      if (index !== -1) {
        educationEntries[index] = { ...educationEntries[index], ...educationData, displayText: `${educationData.degree} - ${educationData.institution}` }
        localStorage.setItem('educationEntries', JSON.stringify(educationEntries))
        return Promise.resolve({ data: educationEntries[index] })
      }
      return Promise.reject(new Error('Education entry not found'))
    }
    return api.put(`/education/${id}`, educationData)
  },
  delete: (id) => {
    if (!api) {
      const educationEntries = JSON.parse(localStorage.getItem('educationEntries') || '[]')
      const filtered = educationEntries.filter(e => e.id != id)
      localStorage.setItem('educationEntries', JSON.stringify(filtered))
      return Promise.resolve({ message: 'Education entry deleted' })
    }
    return api.delete(`/education/${id}`)
  }
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
