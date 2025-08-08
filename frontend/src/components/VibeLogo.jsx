import React from 'react'

const VibeLogo = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    xs: 'w-4 h-4',
    sm: 'w-6 h-6', 
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  }

  return (
    <div className={`${sizeClasses[size]} ${className} relative`}>
      <svg
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* Círculos concêntricos representando vibrações/ondas */}
        <circle
          cx="16"
          cy="16"
          r="14"
          fill="currentColor"
          className="animate-pulse"
          opacity="0.2"
        />
        <circle
          cx="16"
          cy="16"
          r="10"
          fill="currentColor"
          opacity="0.4"
        />
        <circle
          cx="16"
          cy="16"
          r="6"
          fill="currentColor"
          opacity="0.6"
        />
        <circle
          cx="16"
          cy="16"
          r="3"
          fill="currentColor"
        />
        
        {/* Pontos de energia ao redor */}
        <circle cx="16" cy="4" r="1.5" fill="currentColor" opacity="0.8">
          <animate attributeName="opacity" values="0.8;0.3;0.8" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle cx="28" cy="16" r="1.5" fill="currentColor" opacity="0.6">
          <animate attributeName="opacity" values="0.6;0.3;0.6" dur="2s" begin="0.5s" repeatCount="indefinite" />
        </circle>
        <circle cx="16" cy="28" r="1.5" fill="currentColor" opacity="0.4">
          <animate attributeName="opacity" values="0.4;0.1;0.4" dur="2s" begin="1s" repeatCount="indefinite" />
        </circle>
        <circle cx="4" cy="16" r="1.5" fill="currentColor" opacity="0.7">
          <animate attributeName="opacity" values="0.7;0.2;0.7" dur="2s" begin="1.5s" repeatCount="indefinite" />
        </circle>
      </svg>
    </div>
  )
}

// Componente simplificado para uso em espaços menores
export const VibeLogoSimple = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    xs: 'w-4 h-4',
    sm: 'w-6 h-6', 
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  }

  return (
    <div className={`${sizeClasses[size]} ${className} relative`}>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* Versão simplificada - apenas círculos concêntricos */}
        <circle
          cx="12"
          cy="12"
          r="10"
          fill="currentColor"
          opacity="0.2"
        />
        <circle
          cx="12"
          cy="12"
          r="6"
          fill="currentColor"
          opacity="0.5"
        />
        <circle
          cx="12"
          cy="12"
          r="3"
          fill="currentColor"
        />
      </svg>
    </div>
  )
}

export default VibeLogo
