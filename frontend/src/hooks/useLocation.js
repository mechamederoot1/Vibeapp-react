import { useState, useEffect } from 'react'

export const useLocation = () => {
  const [location, setLocation] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const getCurrentLocation = () => {
    setLoading(true)
    setError(null)

    if (!navigator.geolocation) {
      setError('Geolocalização não é suportada neste navegador')
      setLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords
        setLocation({ latitude, longitude, accuracy })
        setLoading(false)
      },
      (err) => {
        setError(`Erro ao obter localização: ${err.message}`)
        setLoading(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutos
      }
    )
  }

  const watchLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocalização não é suportada neste navegador')
      return null
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords
        setLocation({ latitude, longitude, accuracy })
        setError(null)
      },
      (err) => {
        setError(`Erro ao monitorar localização: ${err.message}`)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000 // 1 minuto
      }
    )

    return watchId
  }

  const stopWatching = (watchId) => {
    if (watchId && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId)
    }
  }

  return {
    location,
    error,
    loading,
    getCurrentLocation,
    watchLocation,
    stopWatching
  }
}
