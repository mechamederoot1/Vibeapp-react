import axios from 'axios'

// Configuração base da API
const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL
  }

  const hostname = window.location.hostname
  const protocol = window.location.protocol

  // Em desenvolvimento local, usa localhost com porta específica
  if (import.meta.env.DEV && (hostname === 'localhost' || hostname === '127.0.0.1')) {
    return 'http://localhost:3010/api'
  }

  // Para rede local (ex: 192.168.x.x), usa porta específica
  if (hostname.startsWith('192.168.') || hostname.startsWith('10.0.')) {
    return `http://${hostname}:3010/api`
  }

  // Fallback: usa mesmo domínio com proxy /api (inclui builder.io, fly.dev, netlify, produção etc.)
  return `${protocol}//${hostname}/api`
}

const API_BASE_URL = getApiBaseUrl()

// Cria instância da API
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
      // Não adicionar Authorization para endpoints públicos
      const isPublicEndpoint = config.url?.includes('/auth/register') ||
                               config.url?.includes('/auth/login')

      if (!isPublicEndpoint) {
        const token = localStorage.getItem('token')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
      }
      return config
    },
    (error) => {
      return Promise.reject(error)
    }
  )

  // Interceptor para tratar respostas
  apiInstance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        // Clear local token and broadcast an unauthorized event so SPA can handle gracefully
        try {
          localStorage.removeItem('token')
          if (apiInstance && apiInstance.defaults && apiInstance.defaults.headers) {
            delete apiInstance.defaults.headers.Authorization
          }
        } catch (e) {}

        try {
          window.dispatchEvent(new Event('unauthorized'))
        } catch (e) {}
      }

      return Promise.reject(error)
    }
  )
}

// Add interceptors to both instances only if they exist
if (api) {
  addInterceptors(api)
}
if (uploadApi) {
  addInterceptors(uploadApi)
}

// Safe API wrapper for demo mode
const createSafeAPI = (apiCall) => {
  return (...args) => {
    if (!api) {
      return Promise.reject(new Error('Backend não disponível no modo demo. Por favor, configure um backend real.'))
    }
    try {
      return apiCall(...args)
    } catch (error) {
      return Promise.reject(error)
    }
  }
}

// Auth endpoints
export const authAPI = {
  login: createSafeAPI((email, password) => api.post('/auth/login', { email, password })),
  register: createSafeAPI((userData) => api.post('/auth/register', userData)),
  me: createSafeAPI(() => api.get('/auth/me')),
  logout: createSafeAPI(() => api.post('/auth/logout'))
}

// Users endpoints
export const usersAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (userData) => api.put('/users/profile', userData),
  getUserById: async (identifier) => {
    // Try public id first
    try {
      return await api.get(`/users/by-public-id/${identifier}`)
    } catch (e) {
      if (e.response?.status !== 404) throw e
    }
    // Try by username
    try {
      return await api.get(`/users/by-username/${identifier}`)
    } catch (e) {
      if (e.response?.status !== 404) throw e
    }
    // Fallback to numeric id
    if (/^\d+$/.test(String(identifier))) {
      return api.get(`/users/${identifier}`)
    }
    // If all failed, throw 404-like error
    const err = new Error('User not found')
    err.response = { status: 404 }
    throw err
  },
  getUserStats: (userId) => api.get(`/users/${userId}/stats`),
  getUserPresence: (userId) => api.get(`/users/${userId}/presence`),
  getProfileVisitors: (userId, limit = 10) => api.get(`/users/${userId}/visitors?limit=${limit}`),
  searchUsers: (query, limit = 20) => api.get(`/users/search/users?q=${encodeURIComponent(query)}&limit=${limit}`)
}

// Posts endpoints
export const postsAPI = {
  getFeed: (page = 1, limit = 20) => api.get(`/posts/feed?page=${page}&limit=${limit}`),
  createPost: (postData) => api.post('/posts/', postData),
  getPost: (postId) => api.get(`/posts/${postId}`),
  getByPublicId: (publicId) => api.get(`/posts/by-public-id/${publicId}`),
  likePost: (postId) => api.post(`/posts/${postId}/like`),
  sharePost: (postId) => api.post(`/posts/${postId}/share`),
  repostPost: (postId) => api.post(`/posts/${postId}/repost`),
  getComments: (postId, page = 1, limit = 20) => api.get(`/posts/${postId}/comments?page=${page}&limit=${limit}`),
  createComment: (postId, content) => api.post(`/posts/${postId}/comments`, { content }),
  deletePost: (postId) => api.delete(`/posts/${postId}`),
  updatePost: (postId, data) => api.put(`/posts/${postId}`, data),
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
  cancelFriendRequest: (userId) => api.delete(`/friendships/requests/users/${userId}`),
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
  getAll: () => api.get('/education'),
  create: (educationData) => api.post('/education', educationData),
  update: (id, educationData) => api.put(`/education/${id}`, educationData),
  delete: (id) => api.delete(`/education/${id}`)
}

// Reactions endpoints
export const reactionsAPI = {
  addPostReaction: (postId, reactionType) => api.post(`/reactions/posts/${postId}/reactions`, { reaction_type: reactionType }),
  removePostReaction: (postId) => api.delete(`/reactions/posts/${postId}/reactions`),
  getPostReactions: (postId) => api.get(`/reactions/posts/${postId}/reactions`),
}

// Follows endpoints
export const followsAPI = {
  getStatus: (userId) => api.get(`/follows/users/${userId}/status`),
  follow: (userId) => api.post(`/follows/users/${userId}`),
  unfollow: (userId) => api.delete(`/follows/users/${userId}`),
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
