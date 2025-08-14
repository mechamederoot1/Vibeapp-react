import React from 'react'

const VibeLogoSimple = ({ size = 'md', className = '', showText = true, textColor = '', circular = false }) => {
  const sizeClasses = {
    xs: 'text-lg',
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-4xl',
    xl: 'text-5xl'
  }

  const iconSizes = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  }

  if (circular) {
    // Versão com ícone circular moderno
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <div className={`${iconSizes[size]} bg-gradient-to-br from-vibe-blue to-vibe-blue-dark rounded-xl shadow-lg flex items-center justify-center relative overflow-hidden`}>
          {/* Efeito de brilho */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
          {/* Ícone V estilizado */}
          <div className="text-white font-bold text-sm leading-none">V</div>
        </div>
        {showText && (
          <h1 className={`font-bold ${sizeClasses[size]} text-gray-800 tracking-tight`}>
            Vibe
          </h1>
        )}
      </div>
    )
  }

  return (
    <div className={`flex items-center justify-center ${className}`}>
      {showText && (
        <div className="flex items-center gap-2">
          {/* Ícone pequeno */}
          <div className="w-8 h-8 bg-gradient-to-br from-vibe-blue to-vibe-blue-dark rounded-lg shadow-md flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full"></div>
          </div>
          {/* Texto Vibe */}
          <h1 className={`font-bold ${sizeClasses[size]} ${textColor || 'text-vibe-blue'} tracking-tight`}>
            Vibe
          </h1>
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
