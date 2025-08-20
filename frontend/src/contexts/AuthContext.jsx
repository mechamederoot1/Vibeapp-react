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
      console.log('🔧 Auth init - token:', token ? `${token.substring(0, 20)}...` : 'null')
      if (token) {
        try {
          api.defaults.headers.Authorization = `Bearer ${token}`
          console.log('🔑 Set Authorization header')
          const response = await authAPI.me()
          console.log('✅ Auth init successful, user:', response.data)
          setUser(response.data)
        } catch (error) {
          console.error('❌ Auth init error:', error)
          // Em modo de desenvolvimento, criar um usuário fake
          if (import.meta.env.DEV) {
            console.log('🔧 Creating demo user for development')
            setUser({
              id: 'demo-user',
              firstName: 'Usuário',
              lastName: 'Demo',
              email: 'demo@vibe.com',
              username: 'usuario',
              avatar: null,
              cover: null,
              bio: 'Olá! Bem-vindo ao meu perfil no Vibe Social! 🎉',
              verified: true
            })
            setToken('demo-token')
            localStorage.setItem('token', 'demo-token')
            setLoading(false)
            return
          }
          logout()
        }
      } else if (import.meta.env.DEV) {
        // Em modo de desenvolvimento, criar um usuário fake automaticamente
        console.log('🔧 Creating demo user for development (no token)')
        setUser({
          id: 'demo-user',
          firstName: 'Usuário',
          lastName: 'Demo',
          email: 'demo@vibe.com',
          username: 'usuario',
          avatar: null,
          cover: null,
          bio: 'Olá! Bem-vindo ao meu perfil no Vibe Social! 🎉',
          verified: true
        })
        setToken('demo-token')
        localStorage.setItem('token', 'demo-token')
      }
      setLoading(false)
    }

    initAuth()
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
      api.defaults.headers.Authorization = `Bearer ${authToken}`

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Erro ao criar conta'
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
    isAuthenticated: !!user
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
