import React, { createContext, useContext, useState, useEffect } from 'react'
import api, { authAPI } from '../services/api'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    const initAuth = async () => {
      try {
        // Try to read current user using cookie-based auth
        const response = await authAPI.me()
        if (mounted) setUser(response.data)
      } catch (error) {
        if (mounted) setUser(null)
      }
      if (mounted) setLoading(false)
    }

    // Só executar se não estiver na página de registro
    const currentPath = window.location.pathname
    if (currentPath !== '/register') {
      initAuth()
    } else {
      setLoading(false)
    }

    // Listen for unauthorized events from API layer
    const onUnauthorized = () => {
      logout()
    }
    window.addEventListener('unauthorized', onUnauthorized)

    return () => {
      mounted = false
      window.removeEventListener('unauthorized', onUnauthorized)
    }
  }, [])

  const login = async (email, password) => {
    try {
      // Server will set HttpOnly cookie on success
      await authAPI.login(email, password)
      const res = await authAPI.me()
      setUser(res.data)
      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Erro ao fazer login'
      }
    }
  }

  const register = async (userData) => {
    try {
      await authAPI.register(userData)
      const res = await authAPI.me()
      setUser(res.data)
      return { success: true }
    } catch (error) {
      let errorMessage = 'Erro ao criar conta'

      if (error.message?.includes('Backend não disponível')) {
        errorMessage = 'Backend não está configurado. Por favor, conecte um banco de dados.'
      } else if (error.code === 'ECONNREFUSED' || error.message?.includes('Network Error')) {
        errorMessage = 'Servidor temporariamente indisponível. Tente novamente em alguns minutos.'
      } else if (error.response?.status === 400) {
        errorMessage = error.response.data?.detail || 'Dados inválidos. Verifique as informações e tente novamente.'
      } else if (error.response?.status === 409) {
        errorMessage = 'Este email já está cadastrado. Tente fazer login.'
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail
      }

      return {
        success: false,
        error: errorMessage
      }
    }
  }

  const logout = async () => {
    try {
      await authAPI.logout()
    } catch (e) {
      // ignore errors, ensure local cleanup
    }

    setUser(null)
    setToken(null)
    try { sessionStorage.removeItem('token') } catch(e){}
    try { localStorage.removeItem('token') } catch(e){}
    delete api.defaults.headers.Authorization
  }

  const updateProfile = async (profileData) => {
    try {
      const { usersAPI } = await import('../services/api')
      const response = await usersAPI.updateProfile(profileData)
      setUser(response.data)
      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Erro ao atualizar perfil'
      }
    }
  }

  const value = {
    user,
    setUser,
    loading,
    login,
    register,
    logout,
    updateProfile,
    isAuthenticated: !!user,
    token
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
