import React, { useState } from 'react'
import { X, Eye, Camera } from 'lucide-react'

const CoverViewer = ({ isOpen, onClose, user, onEditPhoto }) => {
  const [currentView, setCurrentView] = useState('options') // 'options', 'photo'

  const handleClose = () => {
    setCurrentView('options')
    onClose()
  }

  const handleViewPhoto = () => {
    setCurrentView('photo')
  }

  const handleBackToOptions = () => {
    setCurrentView('options')
  }

  if (!isOpen || !user) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4 z-50">
      <div className="relative max-w-2xl w-full">
        {/* Botão fechar */}
        <button
          onClick={handleClose}
          className="absolute -top-12 right-0 p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-full z-10"
        >
          <X size={24} />
        </button>

        {currentView === 'options' && (
          <div className="bg-white rounded-lg overflow-hidden">
            {/* Header com capa */}
            <div className="relative">
              <div className="w-full h-48 relative">
                {user.coverPhoto ? (
                  <img
                    src={user.coverPhoto}
                    alt="Capa do perfil"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-vibe-blue via-vibe-blue-light to-purple-300"></div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              </div>
              
              {/* Avatar sobreposto */}
              <div className="absolute -bottom-8 left-6">
                <div className="w-16 h-16 rounded-full border-4 border-white bg-white p-1">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt="Avatar"
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-vibe-blue flex items-center justify-center">
                      <span className="text-white text-xl font-bold">
                        {user.firstName?.charAt(0)?.toUpperCase() || 'U'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Informações do usuário */}
            <div className="pt-12 pb-6 px-6">
              <h3 className="text-lg font-semibold text-gray-900">
                {user.fullName || `${user.firstName} ${user.lastName}`}
              </h3>
              <p className="text-gray-500">@{user.username}</p>
            </div>

            {/* Opções */}
            <div className="border-t border-gray-200">
              <button
                onClick={handleViewPhoto}
                disabled={!user.coverPhoto}
                className="w-full p-4 flex items-center space-x-3 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Eye size={20} className="text-gray-600" />
                <span className="text-gray-900">Ver foto de capa</span>
              </button>

              <button
                onClick={onEditPhoto}
                className="w-full p-4 flex items-center space-x-3 hover:bg-gray-50 border-t border-gray-100"
              >
                <Camera size={20} className="text-gray-600" />
                <span className="text-gray-900">Editar foto de capa</span>
              </button>
            </div>
          </div>
        )}

        {currentView === 'photo' && user.coverPhoto && (
          <div className="text-center">
            <img
              src={user.coverPhoto}
              alt="Foto de capa"
              className="w-full max-w-4xl rounded-lg shadow-lg"
            />
            <button
              onClick={handleBackToOptions}
              className="mt-4 px-4 py-2 bg-white bg-opacity-20 text-white rounded-lg hover:bg-opacity-30"
            >
              Voltar
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default CoverViewer
