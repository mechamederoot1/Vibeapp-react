import axios from 'axios'

// Configuração base da API
const API_BASE_URL = import.meta.env.VITE_API_URL || (
  // Se estamos em desenvolvimento e o proxy está configurado, use caminho relativo
  import.meta.env.DEV ? '/api' : 'http://localhost:8000/api'
)

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds for general requests
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

// Auth endpoints
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (userData) => api.post('/auth/register', userData),
  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
  createDemoUser: () => api.post('/auth/create-demo-user'),
  checkEmail: (email) => api.get(`/auth/check-email/${encodeURIComponent(email)}`)
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
  getFriends: (userId) => usersAPI.getUserStats(userId),
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
