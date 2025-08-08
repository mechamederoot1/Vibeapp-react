import React from 'react'

const VibeLogoSimple = ({ size = 'md', className = '', showText = true, textColor = '' }) => {
  const sizeClasses = {
    xs: 'text-lg',
    sm: 'text-xl', 
    md: 'text-2xl',
    lg: 'text-4xl',
    xl: 'text-6xl'
  }

  const arcSizes = {
    xs: { width: 40, height: 12, strokeWidth: 2 },
    sm: { width: 50, height: 15, strokeWidth: 2.5 },
    md: { width: 60, height: 18, strokeWidth: 3 },
    lg: { width: 100, height: 30, strokeWidth: 4 },
    xl: { width: 140, height: 42, strokeWidth: 5 }
  }

  const arcSize = arcSizes[size]

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* Arco curvo */}
      <div className="mb-1">
        <svg 
          width={arcSize.width} 
          height={arcSize.height}
          viewBox={`0 0 ${arcSize.width} ${arcSize.height}`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d={`M5 ${arcSize.height - 2} Q${arcSize.width / 2} 2 ${arcSize.width - 5} ${arcSize.height - 2}`}
            stroke="currentColor"
            strokeWidth={arcSize.strokeWidth}
            strokeLinecap="round"
            fill="none"
          >
            {/* Animação suave do arco */}
            <animate 
              attributeName="stroke-dasharray" 
              values="0,200;100,200;0,200" 
              dur="4s" 
              repeatCount="indefinite"
            />
          </path>
        </svg>
      </div>

      {/* Texto "Vibe" */}
      {showText && (
        <h1 className={`font-bold tracking-tight ${sizeClasses[size]} ${textColor || 'bg-gradient-to-r from-vibe-blue to-vibe-blue-dark bg-clip-text text-transparent'}`}>
          Vibe
        </h1>
      )}
    </div>
  )
}

// Versão só com o arco (sem texto)
export const VibeArc = ({ size = 'md', className = '' }) => {
  return (
    <VibeLogoSimple 
      size={size} 
      className={className} 
      showText={false} 
    />
  )
}

// Versão com texto branco (para fundos escuros)
export const VibeLogoWhite = ({ size = 'md', className = '' }) => {
  return (
    <VibeLogoSimple 
      size={size} 
      className={className} 
      textColor="text-white" 
    />
  )
}

export default VibeLogoSimple
