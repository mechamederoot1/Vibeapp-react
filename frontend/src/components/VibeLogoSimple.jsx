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
          <div className="relative">
            <h1 className={`font-black ${sizeClasses[size]} bg-gradient-to-r from-vibe-blue via-blue-600 to-vibe-blue-dark bg-clip-text text-transparent tracking-tight relative z-10`}>
              Vibe
            </h1>
            {/* Efeito de glow sutil */}
            <div className="absolute inset-0 bg-gradient-to-r from-vibe-blue/20 to-vibe-blue-dark/20 blur-sm -z-10"></div>
            {/* Linha decorativa */}
            <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-vibe-blue to-transparent"></div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={`flex items-center justify-center ${className}`}>
      {showText && (
        <div className="relative group">
          {/* Texto principal */}
          <h1 className={`font-black ${sizeClasses[size]} ${textColor || 'bg-gradient-to-r from-vibe-blue via-blue-600 to-vibe-blue-dark bg-clip-text text-transparent'} tracking-tight relative z-10 drop-shadow-sm`}>
            Vibe
          </h1>

          {/* Efeito de brilho no hover */}
          <div className="absolute inset-0 bg-gradient-to-r from-vibe-blue/10 to-vibe-blue-dark/10 blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>

          {/* Linha decorativa animada */}
          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-gradient-to-r from-vibe-blue to-vibe-blue-dark rounded-full group-hover:w-full transition-all duration-300"></div>

          {/* Pontos decorativos */}
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-vibe-blue rounded-full opacity-60 animate-pulse"></div>
          <div className="absolute -bottom-1 -left-1 w-1.5 h-1.5 bg-vibe-blue-dark rounded-full opacity-40 animate-pulse" style={{animationDelay: '1s'}}></div>
        </div>
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
