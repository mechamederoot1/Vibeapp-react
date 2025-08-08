import React from 'react'

const VibeLogoSimple = ({ size = 'md', className = '', showText = true, textColor = '' }) => {
  const sizeClasses = {
    xs: 'text-lg',
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-4xl',
    xl: 'text-6xl'
  }

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Texto "Vibe" */}
      {showText && (
        <h1 className={`font-bold tracking-tight ${sizeClasses[size]} ${textColor || 'bg-gradient-to-r from-vibe-blue to-vibe-blue-dark bg-clip-text text-transparent'}`}>
          Vibe
        </h1>
      )}

      {/* Arco pequeno da segunda perna do v até metade do e */}
      <svg
        className="absolute top-0 left-0"
        width="100%"
        height="20"
        viewBox="0 0 100 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M30 15 Q50 5 70 15"
          stroke="#1e40af"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
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
