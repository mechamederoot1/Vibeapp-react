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
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* Ondas dinâmicas representando vibrações */}
        <path
          d="M8 20C8 15 12 12 16 12C20 12 24 15 24 20C24 25 28 28 32 28"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
          opacity="0.3"
        >
          <animate 
            attributeName="d" 
            values="M8 20C8 15 12 12 16 12C20 12 24 15 24 20C24 25 28 28 32 28;M8 20C8 18 12 15 16 15C20 15 24 18 24 20C24 22 28 25 32 25;M8 20C8 15 12 12 16 12C20 12 24 15 24 20C24 25 28 28 32 28" 
            dur="3s" 
            repeatCount="indefinite"
          />
        </path>
        
        <path
          d="M6 20C6 13 11 8 18 8C25 8 30 13 30 20C30 27 35 32 35 32"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
          opacity="0.5"
        >
          <animate 
            attributeName="d" 
            values="M6 20C6 13 11 8 18 8C25 8 30 13 30 20C30 27 35 32 35 32;M6 20C6 16 11 11 18 11C25 11 30 16 30 20C30 24 35 29 35 29;M6 20C6 13 11 8 18 8C25 8 30 13 30 20C30 27 35 32 35 32" 
            dur="2.5s" 
            repeatCount="indefinite"
          />
        </path>
        
        <path
          d="M10 20C10 17 13 14 17 14C21 14 24 17 24 20C24 23 27 26 30 26"
          stroke="currentColor"
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
          opacity="0.8"
        >
          <animate 
            attributeName="d" 
            values="M10 20C10 17 13 14 17 14C21 14 24 17 24 20C24 23 27 26 30 26;M10 20C10 19 13 16 17 16C21 16 24 19 24 20C24 21 27 24 30 24;M10 20C10 17 13 14 17 14C21 14 24 17 24 20C24 23 27 26 30 26" 
            dur="2s" 
            repeatCount="indefinite"
          />
        </path>

        {/* Círculo central pulsante */}
        <circle
          cx="20"
          cy="20"
          r="4"
          fill="currentColor"
        >
          <animate 
            attributeName="r" 
            values="4;6;4" 
            dur="2s" 
            repeatCount="indefinite"
          />
          <animate 
            attributeName="opacity" 
            values="1;0.6;1" 
            dur="2s" 
            repeatCount="indefinite"
          />
        </circle>

        {/* Partículas de energia */}
        <circle cx="12" cy="12" r="1.5" fill="currentColor" opacity="0.6">
          <animate attributeName="cy" values="12;8;12" dur="1.5s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.6;0.2;0.6" dur="1.5s" repeatCount="indefinite" />
        </circle>
        <circle cx="28" cy="12" r="1.5" fill="currentColor" opacity="0.4">
          <animate attributeName="cy" values="12;8;12" dur="1.8s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.4;0.1;0.4" dur="1.8s" repeatCount="indefinite" />
        </circle>
        <circle cx="28" cy="28" r="1.5" fill="currentColor" opacity="0.5">
          <animate attributeName="cy" values="28;32;28" dur="2.2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.5;0.2;0.5" dur="2.2s" repeatCount="indefinite" />
        </circle>
        <circle cx="12" cy="28" r="1.5" fill="currentColor" opacity="0.7">
          <animate attributeName="cy" values="28;32;28" dur="1.6s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.7;0.3;0.7" dur="1.6s" repeatCount="indefinite" />
        </circle>
      </svg>
    </div>
  )
}

// Versão simplificada estática para uso em contextos que não suportam animação
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
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* Ondas estáticas */}
        <path
          d="M6 16C6 12 9 8 14 8C19 8 22 12 22 16C22 20 25 24 28 24"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
          opacity="0.4"
        />
        <path
          d="M8 16C8 14 10 12 13 12C16 12 18 14 18 16C18 18 20 20 22 20"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
          opacity="0.7"
        />
        
        {/* Círculo central */}
        <circle
          cx="16"
          cy="16"
          r="3"
          fill="currentColor"
        />
        
        {/* Pontos de energia */}
        <circle cx="10" cy="10" r="1" fill="currentColor" opacity="0.6" />
        <circle cx="22" cy="10" r="1" fill="currentColor" opacity="0.4" />
        <circle cx="22" cy="22" r="1" fill="currentColor" opacity="0.5" />
        <circle cx="10" cy="22" r="1" fill="currentColor" opacity="0.7" />
      </svg>
    </div>
  )
}

// Versão com pulso minimalista
export const VibeLogoPulse = ({ size = 'md', className = '' }) => {
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
        {/* Círculos de pulso */}
        <circle
          cx="12"
          cy="12"
          r="8"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          opacity="0.2"
          className="animate-ping"
        />
        <circle
          cx="12"
          cy="12"
          r="5"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          opacity="0.4"
          className="animate-pulse"
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
