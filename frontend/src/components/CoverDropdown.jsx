import React, { useRef, useEffect } from 'react'
import { Eye, Camera } from 'lucide-react'

const CoverDropdown = ({ isOpen, onClose, user, onEditCover, onViewCover }) => {
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
      className="absolute top-full right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50 min-w-48"
    >
      <button
        onClick={() => {
          console.log('👁️ Ver capa clicado')
          onViewCover()
          onClose()
        }}
        disabled={!user.coverPhoto}
        className="w-full p-3 flex items-center space-x-3 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-left"
      >
        <Eye size={18} className="text-gray-600" />
        <span className="text-gray-900 text-sm">Ver foto de capa</span>
      </button>

      <button
        onClick={() => {
          console.log('📷 Editar capa clicado')
          onEditCover()
          onClose()
        }}
        className="w-full p-3 flex items-center space-x-3 hover:bg-gray-50 border-t border-gray-100 text-left"
      >
        <Camera size={18} className="text-gray-600" />
        <span className="text-gray-900 text-sm">Editar foto de capa</span>
      </button>
    </div>
  )
}

export default CoverDropdown
