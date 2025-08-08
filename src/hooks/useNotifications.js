import { useState, useEffect } from 'react'

export const useNotifications = () => {
  const [permission, setPermission] = useState(Notification.permission)
  const [error, setError] = useState(null)

  useEffect(() => {
    setPermission(Notification.permission)
  }, [])

  const requestPermission = async () => {
    try {
      if ('Notification' in window) {
        const result = await Notification.requestPermission()
        setPermission(result)
        return result === 'granted'
      } else {
        setError('Notificações não são suportadas neste navegador')
        return false
      }
    } catch (err) {
      setError('Erro ao solicitar permissão para notificações')
      return false
    }
  }

  const sendNotification = (title, options = {}) => {
    if (permission === 'granted') {
      const notification = new Notification(title, {
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        vibrate: [200, 100, 200],
        ...options
      })

      notification.onclick = () => {
        window.focus()
        notification.close()
      }

      return notification
    } else {
      setError('Permissão para notificações não concedida')
      return null
    }
  }

  return {
    permission,
    error,
    requestPermission,
    sendNotification
  }
}
