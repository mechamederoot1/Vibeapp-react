import axios from 'axios'

// Configuração base da API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor para adicionar token de autenticação
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Interceptor para tratar respostas
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

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
