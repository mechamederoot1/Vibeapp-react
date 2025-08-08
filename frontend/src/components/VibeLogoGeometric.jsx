import React from 'react'

const VibeLogoGeometric = ({ size = 'md', className = '' }) => {
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
        {/* Hexágono principal com rotação */}
        <path
          d="M16 4L26 10V22L16 28L6 22V10L16 4Z"
          stroke="currentColor"
          strokeWidth="2"
          fill="currentColor"
          opacity="0.8"
        >
          <animateTransform
            attributeName="transform"
            type="rotate"
            values="0 16 16;360 16 16"
            dur="8s"
            repeatCount="indefinite"
          />
        </path>

        {/* Hexágono interno */}
        <path
          d="M16 8L22 12V20L16 24L10 20V12L16 8Z"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
          opacity="0.6"
        >
          <animateTransform
            attributeName="transform"
            type="rotate"
            values="360 16 16;0 16 16"
            dur="6s"
            repeatCount="indefinite"
          />
        </path>

        {/* Triângulos internos */}
        <path
          d="M16 10L20 14L16 18L12 14Z"
          fill="currentColor"
          opacity="0.4"
        >
          <animateTransform
            attributeName="transform"
            type="rotate"
            values="0 16 16;180 16 16;360 16 16"
            dur="4s"
            repeatCount="indefinite"
          />
        </path>

        {/* Ponto central */}
        <circle
          cx="16"
          cy="16"
          r="2"
          fill="currentColor"
        >
          <animate 
            attributeName="r" 
            values="2;4;2" 
            dur="2s" 
            repeatCount="indefinite"
          />
        </circle>
      </svg>
    </div>
  )
}

// Versão conectividade/network
export const VibeLogoNetwork = ({ size = 'md', className = '' }) => {
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
        {/* Nós da rede */}
        <circle cx="8" cy="8" r="2" fill="currentColor" opacity="0.8" />
        <circle cx="24" cy="8" r="2" fill="currentColor" opacity="0.8" />
        <circle cx="8" cy="24" r="2" fill="currentColor" opacity="0.8" />
        <circle cx="24" cy="24" r="2" fill="currentColor" opacity="0.8" />
        <circle cx="16" cy="6" r="2" fill="currentColor" opacity="0.6" />
        <circle cx="16" cy="26" r="2" fill="currentColor" opacity="0.6" />
        <circle cx="6" cy="16" r="2" fill="currentColor" opacity="0.6" />
        <circle cx="26" cy="16" r="2" fill="currentColor" opacity="0.6" />

        {/* Conexões animadas */}
        <line x1="8" y1="8" x2="16" y2="16" stroke="currentColor" strokeWidth="1.5" opacity="0.4">
          <animate attributeName="opacity" values="0.4;0.8;0.4" dur="2s" repeatCount="indefinite" />
        </line>
        <line x1="24" y1="8" x2="16" y2="16" stroke="currentColor" strokeWidth="1.5" opacity="0.3">
          <animate attributeName="opacity" values="0.3;0.7;0.3" dur="2.5s" repeatCount="indefinite" />
        </line>
        <line x1="8" y1="24" x2="16" y2="16" stroke="currentColor" strokeWidth="1.5" opacity="0.5">
          <animate attributeName="opacity" values="0.5;0.9;0.5" dur="1.8s" repeatCount="indefinite" />
        </line>
        <line x1="24" y1="24" x2="16" y2="16" stroke="currentColor" strokeWidth="1.5" opacity="0.4">
          <animate attributeName="opacity" values="0.4;0.8;0.4" dur="2.2s" repeatCount="indefinite" />
        </line>

        {/* Nó central maior */}
        <circle cx="16" cy="16" r="3" fill="currentColor">
          <animate attributeName="r" values="3;5;3" dur="3s" repeatCount="indefinite" />
        </circle>
      </svg>
    </div>
  )
}

// Versão musical/sound wave
export const VibeLogoSound = ({ size = 'md', className = '' }) => {
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
        {/* Barras de equalizador */}
        <rect x="6" y="14" width="3" height="4" fill="currentColor" opacity="0.8">
          <animate attributeName="height" values="4;12;4" dur="1.2s" repeatCount="indefinite" />
          <animate attributeName="y" values="14;10;14" dur="1.2s" repeatCount="indefinite" />
        </rect>
        <rect x="11" y="12" width="3" height="8" fill="currentColor" opacity="0.9">
          <animate attributeName="height" values="8;16;8" dur="1.5s" repeatCount="indefinite" />
          <animate attributeName="y" values="12;8;12" dur="1.5s" repeatCount="indefinite" />
        </rect>
        <rect x="16" y="8" width="3" height="16" fill="currentColor">
          <animate attributeName="height" values="16;20;16" dur="1.8s" repeatCount="indefinite" />
          <animate attributeName="y" values="8;6;8" dur="1.8s" repeatCount="indefinite" />
        </rect>
        <rect x="21" y="12" width="3" height="8" fill="currentColor" opacity="0.9">
          <animate attributeName="height" values="8;14;8" dur="1.3s" repeatCount="indefinite" />
          <animate attributeName="y" values="12;9;12" dur="1.3s" repeatCount="indefinite" />
        </rect>
        <rect x="26" y="15" width="3" height="2" fill="currentColor" opacity="0.7">
          <animate attributeName="height" values="2;10;2" dur="1.7s" repeatCount="indefinite" />
          <animate attributeName="y" values="15;11;15" dur="1.7s" repeatCount="indefinite" />
        </rect>
      </svg>
    </div>
  )
}

export default VibeLogoGeometric
