import React, { useState, useEffect } from 'react'
import { Wifi, WifiOff, RefreshCw, CheckCircle, XCircle } from 'lucide-react'
import axios from 'axios'

const ApiTester = () => {
  const [status, setStatus] = useState('testing')
  const [backendStatus, setBackendStatus] = useState('unknown')
  const [loading, setLoading] = useState(false)

  const testConnections = async () => {
    setLoading(true)
    setStatus('testing')

    try {
      // Testar conexão com backend
      const backendResponse = await axios.get('http://localhost:8000/api/health', {
        timeout: 5000
      })
      setBackendStatus('online')
      
      // Testar API através do proxy do frontend
      const proxyResponse = await axios.get('/api/health', {
        timeout: 5000
      })
      
      setStatus('connected')
    } catch (error) {
      console.error('Erro de conexão:', error)
      
      // Verificar se é problema de CORS ou se o backend está offline
      if (error.code === 'ERR_NETWORK' || error.message.includes('Network Error')) {
        setBackendStatus('offline')
        setStatus('backend_offline')
      } else if (error.message.includes('CORS')) {
        setBackendStatus('cors_error')
        setStatus('cors_error')
      } else {
        setBackendStatus('error')
        setStatus('error')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    testConnections()
  }, [])

  const getStatusIcon = (status) => {
    switch (status) {
      case 'connected':
      case 'online':
        return <CheckCircle size={16} className="text-green-500" />
      case 'testing':
        return <RefreshCw size={16} className="text-blue-500 animate-spin" />
      case 'offline':
      case 'error':
      case 'cors_error':
        return <XCircle size={16} className="text-red-500" />
      default:
        return <Wifi size={16} className="text-gray-500" />
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'connected':
        return 'Conectado'
      case 'online':
        return 'Online'
      case 'testing':
        return 'Testando...'
      case 'offline':
        return 'Offline'
      case 'backend_offline':
        return 'Backend offline'
      case 'cors_error':
        return 'Erro CORS'
      case 'error':
        return 'Erro'
      default:
        return 'Desconhecido'
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 max-w-sm mx-auto">
      <div className="text-center mb-4">
        <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-2">
          <Wifi size={24} className="text-white" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">Status da API</h3>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
          <span className="text-sm font-medium">Backend (8000)</span>
          <div className="flex items-center space-x-2">
            {getStatusIcon(backendStatus)}
            <span className="text-sm">{getStatusText(backendStatus)}</span>
          </div>
        </div>

        <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
          <span className="text-sm font-medium">Proxy Frontend</span>
          <div className="flex items-center space-x-2">
            {getStatusIcon(status)}
            <span className="text-sm">{getStatusText(status)}</span>
          </div>
        </div>
      </div>

      <button
        onClick={testConnections}
        disabled={loading}
        className="w-full mt-4 py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center justify-center space-x-2"
      >
        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        <span>Testar Novamente</span>
      </button>

      {status === 'backend_offline' && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800 text-sm">
            <strong>Backend offline:</strong> Execute o backend com:
          </p>
          <code className="block mt-1 text-xs bg-gray-800 text-white p-2 rounded">
            python3 start_backend.py
          </code>
        </div>
      )}

      {status === 'cors_error' && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">
            <strong>Erro CORS:</strong> Verifique a configuração no backend
          </p>
        </div>
      )}
    </div>
  )
}

export default ApiTester
