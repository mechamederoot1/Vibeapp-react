import { useState, useRef } from 'react'

export const useCamera = () => {
  const [isActive, setIsActive] = useState(false)
  const [error, setError] = useState(null)
  const videoRef = useRef(null)
  const streamRef = useRef(null)

  const startCamera = async () => {
    try {
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
      setError('Erro ao acessar a câmera: ' + err.message)
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
      setError('Erro ao trocar câmera: ' + err.message)
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
