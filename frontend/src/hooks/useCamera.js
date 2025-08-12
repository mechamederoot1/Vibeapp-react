import { useState, useRef } from 'react'

export const useCamera = () => {
  const [isActive, setIsActive] = useState(false)
  const [error, setError] = useState(null)
  const videoRef = useRef(null)
  const streamRef = useRef(null)

  // Verificar se estamos em um contexto seguro
  const isSecureContext = () => {
    return window.isSecureContext || window.location.protocol === 'https:' || window.location.hostname === 'localhost'
  }

  const startCamera = async () => {
    try {
      // Verificar se estamos em um contexto seguro (HTTPS)
      if (!isSecureContext()) {
        throw new Error('Contexto inseguro. A câmera só funciona com HTTPS.')
      }

      // Verificar se a API de câmera está disponível
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('API de câmera não disponível neste navegador')
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1080 },
          height: { ideal: 1920 }
        },
        audio: false
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }

      streamRef.current = stream
      setIsActive(true)
      setError(null)
    } catch (err) {
      let errorMessage = 'Erro ao acessar a câmera: ' + err.message

      // Mensagens mais específicas para diferentes tipos de erro
      if (err.name === 'NotAllowedError') {
        errorMessage = 'Permissão negada. Por favor, permita o acesso à câmera nas configurações do navegador.'
      } else if (err.name === 'NotFoundError') {
        errorMessage = 'Nenhuma câmera encontrada no dispositivo.'
      } else if (err.name === 'NotSupportedError') {
        errorMessage = 'Câmera não suportada neste navegador.'
      } else if (err.message.includes('Contexto inseguro')) {
        errorMessage = 'Acesso negado. A câmera só funciona com conexão HTTPS segura.'
      } else if (err.message.includes('API de câmera não disponível')) {
        errorMessage = 'Câmera não disponível. Certifique-se de estar usando HTTPS.'
      }

      setError(errorMessage)
      console.error('Camera error:', err)
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setIsActive(false)
  }

  const switchCamera = async () => {
    stopCamera()
    try {
      // Verificar se estamos em um contexto seguro (HTTPS)
      if (!isSecureContext()) {
        throw new Error('Contexto inseguro. A câmera só funciona com HTTPS.')
      }

      // Verificar se a API de câmera está disponível
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('API de câmera não disponível neste navegador')
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: isActive ? 'environment' : 'user',
          width: { ideal: 1080 },
          height: { ideal: 1920 }
        },
        audio: false
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }

      streamRef.current = stream
      setIsActive(true)
    } catch (err) {
      let errorMessage = 'Erro ao trocar câmera: ' + err.message

      if (err.name === 'NotAllowedError') {
        errorMessage = 'Permissão negada para trocar câmera.'
      } else if (err.name === 'NotFoundError') {
        errorMessage = 'Câmera traseira não encontrada.'
      } else if (err.message.includes('Contexto inseguro')) {
        errorMessage = 'Acesso negado. A câmera só funciona com conexão HTTPS segura.'
      } else if (err.message.includes('API de câmera não disponível')) {
        errorMessage = 'Câmera não disponível. Certifique-se de estar usando HTTPS.'
      }

      setError(errorMessage)
    }
  }

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas')
      const video = videoRef.current
      
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      
      const ctx = canvas.getContext('2d')
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      
      return canvas.toDataURL('image/jpeg', 0.8)
    }
    return null
  }

  return {
    videoRef,
    isActive,
    error,
    startCamera,
    stopCamera,
    switchCamera,
    capturePhoto
  }
}
