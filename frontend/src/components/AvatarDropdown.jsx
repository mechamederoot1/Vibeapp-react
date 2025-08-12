import React, { useRef, useEffect } from 'react'
import { Eye, Play, Camera, Settings, LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const AvatarDropdown = ({ isOpen, onClose, user, hasRecentStory = false, onEditPhoto, onViewStory, onViewPhoto }) => {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  if (!isOpen || !user) return null

  return (
    <div
      ref={dropdownRef}
      className="absolute top-full right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-[9999] min-w-48"
      style={{ boxShadow: '0 10px 25px rgba(0,0,0,0.15)' }}
    >
      <button
        onClick={() => {
          onViewPhoto()
          onClose()
        }}
        disabled={!user.avatar}
        className="w-full p-3 flex items-center space-x-3 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-left"
      >
        <Eye size={18} className="text-gray-600" />
        <span className="text-gray-900 text-sm">Ver foto do perfil</span>
      </button>

      {hasRecentStory && (
        <button
          onClick={() => {
            onViewStory()
            onClose()
          }}
          className="w-full p-3 flex items-center space-x-3 hover:bg-gray-50 border-t border-gray-100 text-left"
        >
          <Play size={18} className="text-vibe-blue" />
          <span className="text-gray-900 text-sm">Ver story</span>
        </button>
      )}

      <button
        onClick={() => {
          onEditPhoto()
          onClose()
        }}
        className="w-full p-3 flex items-center space-x-3 hover:bg-gray-50 border-t border-gray-100 text-left"
      >
        <Camera size={18} className="text-gray-600" />
        <span className="text-gray-900 text-sm">Editar foto do perfil</span>
      </button>

      <button
        onClick={() => {
          console.log('🔧 Navegando para configurações...')
          navigate('/settings')
          onClose()
        }}
        className="w-full p-3 flex items-center space-x-3 hover:bg-gray-50 border-t border-gray-100 text-left"
      >
        <Settings size={18} className="text-gray-600" />
        <span className="text-gray-900 text-sm">Configurações</span>
      </button>

      <button
        onClick={() => {
          logout()
          onClose()
        }}
        className="w-full p-3 flex items-center space-x-3 hover:bg-red-50 border-t border-gray-100 text-left text-red-600"
      >
        <LogOut size={18} className="text-red-600" />
        <span className="text-red-600 text-sm">Sair</span>
      </button>
    </div>
  )
}

export default AvatarDropdown
