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
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 safe-area-top">
        <button
          onClick={onClose}
          className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-full"
        >
          <X size={24} />
        </button>
        <h2 className="text-white font-semibold">Câmera</h2>
        <button
          onClick={switchCamera}
          className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-full"
          disabled={!isActive}
        >
          <RotateCcw size={24} />
        </button>
      </div>

      {/* Camera View */}
      <div className="flex-1 relative">
        {error ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-white p-4">
              <p className="mb-4">{error}</p>
              <button
                onClick={startCamera}
                className="btn-primary"
              >
                Tentar Novamente
              </button>
            </div>
          </div>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {/* Controls */}
      {isActive && (
        <div className="p-6 safe-area-bottom">
          <div className="flex items-center justify-center">
            <button
              onClick={handleCapture}
              className="w-16 h-16 bg-white rounded-full flex items-center justify-center hover:scale-110 transition-transform"
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
