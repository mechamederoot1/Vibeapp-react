import React, { useState } from 'react'
import { X, Eye, Play, User, Camera } from 'lucide-react'

const AvatarViewer = ({ isOpen, onClose, user, hasRecentStory = false, onEditPhoto, onViewStory }) => {
  const [currentView, setCurrentView] = useState('options') // 'options', 'photo', 'story'

  const handleClose = () => {
    setCurrentView('options')
    onClose()
  }

  const handleViewPhoto = () => {
    setCurrentView('photo')
  }

  const handleViewStory = () => {
    if (onViewStory) {
      onViewStory()
    } else {
      setCurrentView('story')
    }
  }

  const handleBackToOptions = () => {
    setCurrentView('options')
  }

  if (!isOpen || !user) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4 z-50">
      <div className="relative max-w-sm w-full">
        {/* Botão fechar */}
        <button
          onClick={handleClose}
          className="absolute -top-12 right-0 p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-full"
        >
          <X size={24} />
        </button>

        {currentView === 'options' && (
          <div className="bg-white rounded-lg overflow-hidden">
            {/* Header com avatar */}
            <div className="p-6 text-center">
              <div className="w-32 h-32 mx-auto mb-4 relative">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt="Avatar"
                    className="w-full h-full rounded-full object-cover border-4 border-white shadow-lg"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-vibe-blue flex items-center justify-center border-4 border-white shadow-lg">
                    <span className="text-white text-4xl font-bold">
                      {user.firstName?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                )}
                
                {/* Indicador de story */}
                {hasRecentStory && (
                  <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 p-1">
                    <div className="w-full h-full rounded-full bg-white p-1">
                      <div className="w-full h-full rounded-full bg-gray-200"></div>
                    </div>
                  </div>
                )}
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900">
                {user.fullName || `${user.firstName} ${user.lastName}`}
              </h3>
              <p className="text-gray-500">@{user.username}</p>
            </div>

            {/* Opções */}
            <div className="border-t border-gray-200">
              <button
                onClick={handleViewPhoto}
                disabled={!user.avatar}
                className="w-full p-4 flex items-center space-x-3 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Eye size={20} className="text-gray-600" />
                <span className="text-gray-900">Ver foto do perfil</span>
              </button>

              {hasRecentStory ? (
                <button
                  onClick={handleViewStory}
                  className="w-full p-4 flex items-center space-x-3 hover:bg-gray-50 border-t border-gray-100"
                >
                  <Play size={20} className="text-vibe-blue" />
                  <span className="text-gray-900">Ver story</span>
                  <span className="ml-auto text-xs bg-vibe-blue text-white px-2 py-1 rounded-full">Novo</span>
                </button>
              ) : (
                <div className="w-full p-4 flex items-center space-x-3 border-t border-gray-100 opacity-50">
                  <Play size={20} className="text-gray-400" />
                  <span className="text-gray-500">Nenhum story disponível</span>
                </div>
              )}

              <button
                onClick={onEditPhoto}
                className="w-full p-4 flex items-center space-x-3 hover:bg-gray-50 border-t border-gray-100"
              >
                <Camera size={20} className="text-gray-600" />
                <span className="text-gray-900">Editar foto do perfil</span>
              </button>
            </div>
          </div>
        )}

        {currentView === 'photo' && user.avatar && (
          <div className="text-center">
            <img
              src={user.avatar}
              alt="Foto do perfil"
              className="w-full max-w-sm rounded-lg shadow-lg"
            />
            <button
              onClick={handleBackToOptions}
              className="mt-4 px-4 py-2 bg-white bg-opacity-20 text-white rounded-lg hover:bg-opacity-30"
            >
              Voltar
            </button>
          </div>
        )}

        {currentView === 'story' && (
          <div className="bg-black rounded-lg p-4 text-center">
            <div className="text-white mb-4">
              <h3 className="font-semibold">{user.fullName}</h3>
              <p className="text-sm text-gray-300">Story recente</p>
            </div>
            
            {/* Placeholder para story */}
            <div className="bg-gray-800 rounded-lg p-8 mb-4">
              <Play size={48} className="text-gray-400 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">
                Stories em desenvolvimento
              </p>
            </div>
            
            <button
              onClick={handleBackToOptions}
              className="px-4 py-2 bg-white bg-opacity-20 text-white rounded-lg hover:bg-opacity-30"
            >
              Voltar
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default AvatarViewer
