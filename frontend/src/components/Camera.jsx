import React, { useEffect } from 'react'
import { X, Camera as CameraIcon, RotateCcw, Download } from 'lucide-react'
import { useCamera } from '../hooks/useCamera'

const Camera = ({ isOpen, onClose, onCapture }) => {
  const { 
    videoRef, 
    isActive, 
    error, 
    startCamera, 
    stopCamera, 
    switchCamera, 
    capturePhoto 
  } = useCamera()

  useEffect(() => {
    if (isOpen) {
      startCamera()
    } else {
      stopCamera()
    }

    return () => stopCamera()
  }, [isOpen])

  const handleCapture = () => {
    const photo = capturePhoto()
    if (photo && onCapture) {
      onCapture(photo)
    }
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="camera-container">
      {/* Header */}
      <div className="camera-header">
        <button
          onClick={onClose}
          className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
        >
          <X size={24} />
        </button>
        <h2 className="text-white font-semibold text-lg">Câmera</h2>
        <button
          onClick={switchCamera}
          className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-full transition-colors disabled:opacity-50"
          disabled={!isActive}
        >
          <RotateCcw size={24} />
        </button>
      </div>

      {/* Camera View */}
      <div className="flex-1 relative">
        {error ? (
          <div className="camera-error">
            <div className="text-center text-white max-w-sm mx-auto">
              <div className="mb-6">
                <CameraIcon size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-sm leading-relaxed">{error}</p>
              </div>
              <div className="space-y-3">
                <button
                  onClick={startCamera}
                  className="btn-primary w-full"
                >
                  Tentar Novamente
                </button>
                <div className="text-xs text-gray-400">
                  {error.includes('HTTPS') && (
                    <p>💡 Dica: A câmera só funciona com conexão segura (HTTPS)</p>
                  )}
                  {error.includes('Permissão') && (
                    <p>💡 Dica: Verifique as permissões da câmera no navegador</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="camera-video"
          />
        )}
      </div>

      {/* Controls */}
      {isActive && (
        <div className="camera-controls">
          <div className="flex items-center justify-center">
            <button
              onClick={handleCapture}
              className="camera-capture-btn"
            >
              <CameraIcon size={32} className="text-gray-800" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Camera
