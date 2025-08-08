import React, { useEffect, useState } from 'react'
import VibeLogoSimple from './VibeLogoSimple'

const SplashScreen = ({ onComplete, duration = 5000 }) => {
  const [fadeOut, setFadeOut] = useState(false)

  useEffect(() => {
    // Iniciar fade out um pouco antes do fim
    const fadeTimer = setTimeout(() => {
      setFadeOut(true)
    }, duration - 500)

    // Completar splash screen
    const completeTimer = setTimeout(() => {
      onComplete()
    }, duration)

    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(completeTimer)
    }
  }, [duration, onComplete])

  return (
    <div 
      className={`fixed inset-0 bg-gradient-to-br from-vibe-blue via-vibe-blue-light to-vibe-blue-dark flex items-center justify-center z-50 transition-opacity duration-500 ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Partículas de fundo */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-white rounded-full opacity-20 animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 3}s`
            }}
          />
        ))}
      </div>

      {/* Logo central */}
      <div className="relative z-10 text-center">
        <div className="animate-fade-in">
          <VibeLogoSimple
            size="xl"
            className="text-white scale-110"
            textColor="text-white"
          />
        </div>

        {/* Tagline */}
        <p className="text-white/90 text-xl mt-6 font-light tracking-wide animate-fade-in-delay">
          Conecte-se e compartilhe suas vibes
        </p>

        {/* Loading indicator */}
        <div className="mt-10 flex items-center justify-center">
          <div className="w-40 h-1 bg-white/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full shadow-lg"
              style={{
                animation: `loading-bar ${duration}ms ease-out forwards`
              }}
            />
          </div>
        </div>

        {/* Versão pequena */}
        <p className="text-white/60 text-sm mt-4 font-light animate-fade-in-delay-2">
          v1.0.0
        </p>
      </div>

      {/* Ondas de fundo */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg 
          viewBox="0 0 1200 120" 
          preserveAspectRatio="none" 
          className="w-full h-16 fill-white/10"
        >
          <path d="M0,60 C150,120 350,0 600,60 C850,120 1050,0 1200,60 L1200,120 L0,120 Z">
            <animate 
              attributeName="d" 
              values="M0,60 C150,120 350,0 600,60 C850,120 1050,0 1200,60 L1200,120 L0,120 Z;M0,60 C150,0 350,120 600,60 C850,0 1050,120 1200,60 L1200,120 L0,120 Z;M0,60 C150,120 350,0 600,60 C850,120 1050,0 1200,60 L1200,120 L0,120 Z" 
              dur="6s" 
              repeatCount="indefinite"
            />
          </path>
        </svg>
      </div>

      <style jsx>{`
        @keyframes loading-bar {
          from { width: 0%; }
          to { width: 100%; }
        }
        
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes fade-in-delay {
          0%, 30% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        @keyframes fade-in-delay-2 {
          0%, 60% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fade-in {
          animation: fade-in 1s ease-out forwards;
        }
        
        .animate-fade-in-delay {
          animation: fade-in-delay 2s ease-out forwards;
        }

        .animate-fade-in-delay-2 {
          animation: fade-in-delay-2 3s ease-out forwards;
        }
        
        .animate-loading-bar {
          animation: loading-bar ${duration}ms linear forwards;
        }
      `}</style>
    </div>
  )
}

export default SplashScreen
