import React from 'react'
import { X } from 'lucide-react'

const CoverModal = ({ isOpen, onClose, user }) => {
  if (!isOpen || !user || !user.coverPhoto) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4 z-50">
      <div className="relative max-w-4xl w-full">
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-full"
        >
          <X size={24} />
        </button>
        
        <div className="text-center">
          <img
            src={user.coverPhoto}
            alt="Foto de capa"
            className="w-full max-w-4xl rounded-lg shadow-lg"
          />
        </div>
      </div>
    </div>
  )
}

export default CoverModal
