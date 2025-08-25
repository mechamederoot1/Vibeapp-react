import React, { useState, useEffect } from 'react'
import { Camera, Mic, Image, X, Check } from 'lucide-react'

const PermissionsHandler = ({ onPermissionsGranted }) => {
  const [showModal, setShowModal] = useState(false)
  const [permissions, setPermissions] = useState({
    camera: null,
    microphone: null,
    storage: null
  })
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Check if we should show permissions modal
    const hasAskedBefore = localStorage.getItem('permissions_asked')
    if (!hasAskedBefore) {
      // Delay to show after app loads
      setTimeout(() => {
        setShowModal(true)
      }, 2000)
    }
  }, [])

  const requestPermission = async (type) => {
    setLoading(true)
    
    try {
      let granted = false
      
      switch (type) {
        case 'camera':
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true })
            stream.getTracks().forEach(track => track.stop()) // Stop immediately after getting permission
            granted = true
          } catch (error) {
            console.log('Camera permission denied:', error)
            granted = false
          }
          break
          
        case 'microphone':
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            stream.getTracks().forEach(track => track.stop()) // Stop immediately after getting permission
            granted = true
          } catch (error) {
            console.log('Microphone permission denied:', error)
            granted = false
          }
          break
          
        case 'storage':
          // For storage, we'll just simulate since it's automatic on file selection
          granted = true
          break
          
        default:
          granted = false
      }
      
      setPermissions(prev => ({
        ...prev,
        [type]: granted
      }))
      
      return granted
    } catch (error) {
      console.error(`Error requesting ${type} permission:`, error)
      setPermissions(prev => ({
        ...prev,
        [type]: false
      }))
      return false
    } finally {
      setLoading(false)
    }
  }

  const handleRequestPermission = async (type) => {
    await requestPermission(type)
    
    // Move to next step or finish
    if (currentStep < permissionSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleFinish()
    }
  }

  const handleSkip = () => {
    if (currentStep < permissionSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleFinish()
    }
  }

  const handleFinish = () => {
    setShowModal(false)
    localStorage.setItem('permissions_asked', 'true')
    if (onPermissionsGranted) {
      onPermissionsGranted(permissions)
    }
  }

  const permissionSteps = [
    {
      type: 'camera',
      icon: Camera,
      title: 'Acesso à Câmera',
      description: 'Para tirar fotos e gravar vídeos diretamente no app',
      color: 'bg-blue-500'
    },
    {
      type: 'microphone',
      icon: Mic,
      title: 'Acesso ao Microfone',
      description: 'Para gravar áudios e vídeos com som',
      color: 'bg-green-500'
    },
    {
      type: 'storage',
      icon: Image,
      title: 'Acesso à Galeria',
      description: 'Para selecionar fotos e vídeos da sua galeria',
      color: 'bg-purple-500'
    }
  ]

  if (!showModal) return null

  const currentPermission = permissionSteps[currentStep]
  const Icon = currentPermission.icon

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 md:p-4">
      <div className="bg-white md:rounded-2xl shadow-xl w-full h-full md:h-auto md:max-w-md overflow-hidden md:overflow-visible">
        {/* Header */}
        <div className="p-6 md:p-6 pt-12 md:pt-6 text-center flex-1 md:flex-initial flex flex-col justify-center md:justify-start">
          <div className={`w-24 h-24 md:w-20 md:h-20 ${currentPermission.color} rounded-full flex items-center justify-center mx-auto mb-6 md:mb-4`}>
            <Icon size={36} className="text-white md:w-8 md:h-8" />
          </div>
          <h2 className="text-3xl md:text-2xl font-bold text-gray-900 mb-4 md:mb-2">
            {currentPermission.title}
          </h2>
          <p className="text-lg md:text-base text-gray-600 leading-relaxed px-4 md:px-0">
            {currentPermission.description}
          </p>
        </div>

        {/* Progress */}
        <div className="px-6 md:px-6 px-8 mb-8 md:mb-6">
          <div className="flex items-center justify-between text-sm md:text-xs text-gray-500 mb-3 md:mb-2">
            <span>Passo {currentStep + 1} de {permissionSteps.length}</span>
            <span>{Math.round(((currentStep + 1) / permissionSteps.length) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 md:h-2">
            <div
              className="bg-vibe-blue h-3 md:h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / permissionSteps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Permission Status */}
        {permissions[currentPermission.type] !== null && (
          <div className="px-6 mb-4">
            <div className={`flex items-center space-x-2 p-3 rounded-lg ${
              permissions[currentPermission.type] 
                ? 'bg-green-50 text-green-700' 
                : 'bg-red-50 text-red-700'
            }`}>
              {permissions[currentPermission.type] ? (
                <Check size={20} />
              ) : (
                <X size={20} />
              )}
              <span className="text-sm font-medium">
                {permissions[currentPermission.type] 
                  ? 'Permissão concedida!' 
                  : 'Permissão negada'
                }
              </span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="p-6 space-y-3">
          <button
            onClick={() => handleRequestPermission(currentPermission.type)}
            disabled={loading}
            className="w-full bg-vibe-blue text-white py-3 px-4 rounded-lg hover:bg-vibe-blue-dark transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Icon size={20} />
                <span>Permitir Acesso</span>
              </>
            )}
          </button>
          
          <button
            onClick={handleSkip}
            disabled={loading}
            className="w-full text-gray-600 py-2 px-4 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Agora não
          </button>

          {/* Skip All */}
          <button
            onClick={handleFinish}
            disabled={loading}
            className="w-full text-gray-400 text-sm py-1"
          >
            Pular todas as permissões
          </button>
        </div>

        {/* Benefits */}
        <div className="bg-gray-50 p-4">
          <p className="text-xs text-gray-600 text-center">
            Você pode alterar essas permissões a qualquer momento nas configurações do seu navegador
          </p>
        </div>
      </div>
    </div>
  )
}

export default PermissionsHandler
