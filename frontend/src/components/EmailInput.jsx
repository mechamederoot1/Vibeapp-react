import React, { useEffect } from 'react'
import { Check, X, Loader2, Mail } from 'lucide-react'
import { useEmailValidation } from '../hooks/useEmailValidation'

const EmailInput = ({ 
  value, 
  onChange, 
  placeholder = "Digite seu e-mail",
  className = "",
  onValidationChange,
  disabled = false
}) => {
  const { isChecking, isValid, isAvailable, error, validateEmail } = useEmailValidation()

  useEffect(() => {
    validateEmail(value)
  }, [value, validateEmail])

  useEffect(() => {
    // Notificar o componente pai sobre o estado da validação
    if (onValidationChange) {
      onValidationChange({
        isValid: isValid && isAvailable,
        isChecking,
        error
      })
    }
  }, [isValid, isAvailable, isChecking, error, onValidationChange])

  const getInputState = () => {
    if (!value) return 'default'
    if (isChecking) return 'checking'
    if (!isValid) return 'invalid'
    if (isValid && isAvailable === false) return 'unavailable'
    if (isValid && isAvailable === true) return 'available'
    return 'default'
  }

  const getInputClasses = () => {
    const baseClasses = "w-full p-4 pr-12 border rounded-lg focus:outline-none transition-all duration-200"
    
    switch (getInputState()) {
      case 'checking':
        return `${baseClasses} border-blue-300 focus:border-blue-500 bg-blue-50/30`
      case 'invalid':
        return `${baseClasses} border-red-300 focus:border-red-500 bg-red-50/30`
      case 'unavailable':
        return `${baseClasses} border-red-300 focus:border-red-500 bg-red-50/30`
      case 'available':
        return `${baseClasses} border-green-300 focus:border-green-500 bg-green-50/30`
      default:
        return `${baseClasses} border-gray-300 focus:border-vibe-blue`
    }
  }

  const getIcon = () => {
    switch (getInputState()) {
      case 'checking':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
      case 'invalid':
        return <X className="w-5 h-5 text-red-500" />
      case 'unavailable':
        return <X className="w-5 h-5 text-red-500" />
      case 'available':
        return <Check className="w-5 h-5 text-green-500" />
      default:
        return <Mail className="w-5 h-5 text-gray-400" />
    }
  }

  const getMessage = () => {
    if (!value) return null
    
    switch (getInputState()) {
      case 'checking':
        return <span className="text-blue-600 text-sm">Verificando disponibilidade...</span>
      case 'invalid':
        return <span className="text-red-600 text-sm">{error}</span>
      case 'unavailable':
        return <span className="text-red-600 text-sm">{error}</span>
      case 'available':
        return <span className="text-green-600 text-sm">E-mail disponível!</span>
      default:
        return null
    }
  }

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <input
          type="email"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={getInputClasses()}
          disabled={disabled}
          autoComplete="email"
        />
        
        {/* Ícone de status */}
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
          {getIcon()}
        </div>
      </div>
      
      {/* Mensagem de status */}
      <div className="mt-2 min-h-[20px]">
        {getMessage()}
      </div>
    </div>
  )
}

export default EmailInput
