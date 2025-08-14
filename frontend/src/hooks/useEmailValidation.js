import { useState, useCallback } from 'react'
import { authAPI } from '../services/api'

export const useEmailValidation = () => {
  const [validationState, setValidationState] = useState({
    isChecking: false,
    isValid: null,
    isAvailable: null,
    error: null
  })

  // Debounce para evitar muitas requisições
  const debounce = (func, delay) => {
    let timeoutId
    return (...args) => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => func(...args), delay)
    }
  }

  const validateEmail = useCallback(
    debounce(async (email) => {
      // Validação básica de formato
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      
      if (!email) {
        setValidationState({
          isChecking: false,
          isValid: null,
          isAvailable: null,
          error: null
        })
        return
      }

      if (!emailRegex.test(email)) {
        setValidationState({
          isChecking: false,
          isValid: false,
          isAvailable: null,
          error: 'Formato de e-mail inválido'
        })
        return
      }

      // Se o formato está correto, verificar disponibilidade
      setValidationState(prev => ({
        ...prev,
        isChecking: true,
        isValid: true,
        error: null
      }))

      try {
        const response = await api.get(`/auth/check-email/${encodeURIComponent(email)}`)
        
        setValidationState({
          isChecking: false,
          isValid: true,
          isAvailable: response.data.available,
          error: response.data.exists ? 'Este e-mail já está em uso' : null
        })
      } catch (error) {
        console.error('Erro ao verificar e-mail:', error)
        setValidationState({
          isChecking: false,
          isValid: true,
          isAvailable: null,
          error: 'Erro ao verificar e-mail'
        })
      }
    }, 500), // 500ms de delay
    []
  )

  const reset = () => {
    setValidationState({
      isChecking: false,
      isValid: null,
      isAvailable: null,
      error: null
    })
  }

  return {
    ...validationState,
    validateEmail,
    reset
  }
}
