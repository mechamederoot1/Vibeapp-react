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
  const [token, setToken] = useState(localStorage.getItem('token'))

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          if (api) {
            api.defaults.headers.Authorization = `Bearer ${token}`
            const response = await authAPI.me()
            setUser(response.data)
          }
        } catch (error) {
          // Não fazer logout agressivo - só limpar estado
          console.error('Token inválido:', error.message)
          setUser(null)
          setToken(null)
          localStorage.removeItem('token')
          if (api) {
            delete api.defaults.headers.Authorization
          }
        }
      }
      setLoading(false)
    }

    // Só executar se não estiver na página de registro
    const currentPath = window.location.pathname
    if (currentPath !== '/register') {
      initAuth()
    } else {
      setLoading(false)
    }
  }, [token])

  const login = async (email, password) => {
    try {
      const response = await authAPI.login(email, password)
      const { user: userData, access_token: authToken } = response.data

      setUser(userData)
      setToken(authToken)
      localStorage.setItem('token', authToken)
      api.defaults.headers.Authorization = `Bearer ${authToken}`

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
      const response = await authAPI.register(userData)
      const { user: newUser, access_token: authToken } = response.data

      setUser(newUser)
      setToken(authToken)
      localStorage.setItem('token', authToken)
      if (api) {
        api.defaults.headers.Authorization = `Bearer ${authToken}`
      }

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

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('token')
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
