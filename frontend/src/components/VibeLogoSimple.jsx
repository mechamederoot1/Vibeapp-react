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
        <div className="relative group cursor-pointer">
          {/* Background glow premium */}
          <div className="absolute inset-0 bg-gradient-to-r from-vibe-blue/30 via-blue-500/20 to-vibe-blue-dark/30 blur-xl scale-110 opacity-0 group-hover:opacity-100 transition-all duration-500 -z-20"></div>

          {/* Frame elegante */}
          <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl px-6 py-3 shadow-lg border border-blue-100/50 group-hover:shadow-xl group-hover:border-blue-200/70 transition-all duration-300">

            {/* Texto principal com efeito premium */}
            <h1 className={`font-black ${sizeClasses[size]} bg-gradient-to-r from-vibe-blue via-blue-600 to-vibe-blue-dark bg-clip-text text-transparent tracking-tight relative z-10 drop-shadow-sm`}>
              <span className="relative">
                V
                <span className="inline-block transition-transform group-hover:scale-105 duration-300">i</span>
                <span className="inline-block transition-transform group-hover:scale-105 duration-300" style={{transitionDelay: '50ms'}}>b</span>
                <span className="inline-block transition-transform group-hover:scale-105 duration-300" style={{transitionDelay: '100ms'}}>e</span>
              </span>
            </h1>

            {/* Linha de energia animada */}
            <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-4 h-0.5 bg-gradient-to-r from-transparent via-vibe-blue to-transparent rounded-full group-hover:w-3/4 transition-all duration-500"></div>

            {/* Partículas flutuantes */}
            <div className="absolute -top-2 left-2 w-1 h-1 bg-vibe-blue rounded-full opacity-60 animate-bounce" style={{animationDelay: '0s', animationDuration: '2s'}}></div>
            <div className="absolute -top-1 right-3 w-1.5 h-1.5 bg-blue-400 rounded-full opacity-40 animate-bounce" style={{animationDelay: '0.5s', animationDuration: '2.5s'}}></div>
            <div className="absolute -bottom-2 right-1 w-1 h-1 bg-vibe-blue-dark rounded-full opacity-50 animate-bounce" style={{animationDelay: '1s', animationDuration: '3s'}}></div>

            {/* Reflexo premium */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent rounded-2xl pointer-events-none"></div>
          </div>
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
