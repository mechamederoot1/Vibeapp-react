import React from 'react'

const VibeLogoSimple = ({ size = 'md', className = '', showText = true, textColor = '', circular = false }) => {
  const sizeClasses = {
    xs: 'text-lg',
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-4xl',
    xl: 'text-5xl'
  }

  if (circular) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        {showText && (
          <h1 className={`font-bold ${sizeClasses[size]} bg-gradient-to-r from-vibe-blue to-vibe-blue-dark bg-clip-text text-transparent tracking-tight`}>
            Vibe
          </h1>
        )}
      </div>
    )
  }

  return (
    <div className={`flex items-center justify-center ${className}`}>
      {showText && (
        <h1 className={`font-bold ${sizeClasses[size]} ${textColor || 'bg-gradient-to-r from-vibe-blue to-vibe-blue-dark bg-clip-text text-transparent'} tracking-tight`}>
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

// Versão circular com fundo azul
export const VibeLogoCircular = ({ size = 'md', className = '' }) => {
  return (
    <VibeLogoSimple
      size={size}
      className={className}
      circular={true}
    />
  )
}

// Versão circular apenas com o círculo (sem texto)
export const VibeCircleOnly = ({ size = 'md', className = '' }) => {
  return (
    <VibeLogoSimple
      size={size}
      className={className}
      circular={true}
      showText={false}
    />
  )
}

export default VibeLogoSimple
