import React, { useState, useEffect } from 'react'
import { Bug, Server, Database, Check, X, AlertTriangle } from 'lucide-react'
import axios from 'axios'

const BackendDebug = () => {
  const [debugInfo, setDebugInfo] = useState({
    backend: { status: 'checking', message: '' },
    database: { status: 'checking', message: '' },
    auth: { status: 'checking', message: '' },
    stories: { status: 'checking', message: '' }
  })

  const checkBackend = async () => {
    try {
      const response = await axios.get('/api/health', { timeout: 5000 })
      return { status: 'ok', message: 'Backend online' }
    } catch (error) {
      if (error.code === 'ERR_NETWORK') {
        return { status: 'error', message: 'Backend offline - verifique se está rodando na porta 8000' }
      }
      return { status: 'error', message: `Erro: ${error.message}` }
    }
  }

  const checkDatabase = async () => {
    try {
      const response = await axios.post('/api/dev/migrate-database', {}, { timeout: 10000 })
      if (response.data.error) {
        return { status: 'error', message: response.data.error }
      }
      return { status: 'ok', message: 'Database OK' }
    } catch (error) {
      return { status: 'error', message: `DB Error: ${error.response?.data?.detail || error.message}` }
    }
  }

  const checkAuth = async () => {
    try {
      const response = await axios.get('/api/auth/me', { timeout: 5000 })
      return { status: 'ok', message: 'Auth working' }
    } catch (error) {
      if (error.response?.status === 401) {
        return { status: 'warning', message: 'Not logged in (normal)' }
      }
      return { status: 'error', message: `Auth Error: ${error.response?.data?.detail || error.message}` }
    }
  }

  const checkStories = async () => {
    try {
      const response = await axios.get('/api/stories', { timeout: 5000 })
      return { status: 'ok', message: `Stories OK (${response.data.total || 0} found)` }
    } catch (error) {
      return { status: 'error', message: `Stories Error: ${error.response?.data?.detail || error.message}` }
    }
  }

  const runAllChecks = async () => {
    setDebugInfo({
      backend: { status: 'checking', message: 'Verificando...' },
      database: { status: 'checking', message: 'Verificando...' },
      auth: { status: 'checking', message: 'Verificando...' },
      stories: { status: 'checking', message: 'Verificando...' }
    })

    const [backendResult, databaseResult, authResult, storiesResult] = await Promise.all([
      checkBackend(),
      checkDatabase(),
      checkAuth(),
      checkStories()
    ])

    setDebugInfo({
      backend: backendResult,
      database: databaseResult,
      auth: authResult,
      stories: storiesResult
    })
  }

  useEffect(() => {
    runAllChecks()
  }, [])

  const getStatusIcon = (status) => {
    switch (status) {
      case 'ok':
        return <Check size={16} className="text-green-500" />
      case 'warning':
        return <AlertTriangle size={16} className="text-yellow-500" />
      case 'error':
        return <X size={16} className="text-red-500" />
      default:
        return <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'ok': return 'bg-green-50 border-green-200'
      case 'warning': return 'bg-yellow-50 border-yellow-200'
      case 'error': return 'bg-red-50 border-red-200'
      default: return 'bg-blue-50 border-blue-200'
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <Bug size={32} className="text-white" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Debug do Backend</h2>
        <p className="text-gray-600 text-sm">
          Diagnóstico completo dos componentes do sistema
        </p>
      </div>

      <div className="space-y-3">
        <div className={`p-3 rounded-lg border ${getStatusColor(debugInfo.backend.status)}`}>
          <div className="flex items-center justify-between mb-1">
            <span className="font-medium flex items-center">
              <Server size={16} className="mr-2" />
              Backend API
            </span>
            {getStatusIcon(debugInfo.backend.status)}
          </div>
          <p className="text-sm text-gray-600">{debugInfo.backend.message}</p>
        </div>

        <div className={`p-3 rounded-lg border ${getStatusColor(debugInfo.database.status)}`}>
          <div className="flex items-center justify-between mb-1">
            <span className="font-medium flex items-center">
              <Database size={16} className="mr-2" />
              Database
            </span>
            {getStatusIcon(debugInfo.database.status)}
          </div>
          <p className="text-sm text-gray-600">{debugInfo.database.message}</p>
        </div>

        <div className={`p-3 rounded-lg border ${getStatusColor(debugInfo.auth.status)}`}>
          <div className="flex items-center justify-between mb-1">
            <span className="font-medium flex items-center">
              <Bug size={16} className="mr-2" />
              Autenticação
            </span>
            {getStatusIcon(debugInfo.auth.status)}
          </div>
          <p className="text-sm text-gray-600">{debugInfo.auth.message}</p>
        </div>

        <div className={`p-3 rounded-lg border ${getStatusColor(debugInfo.stories.status)}`}>
          <div className="flex items-center justify-between mb-1">
            <span className="font-medium flex items-center">
              <Bug size={16} className="mr-2" />
              Stories API
            </span>
            {getStatusIcon(debugInfo.stories.status)}
          </div>
          <p className="text-sm text-gray-600">{debugInfo.stories.message}</p>
        </div>
      </div>

      <button
        onClick={runAllChecks}
        className="w-full mt-4 py-2 px-4 bg-orange-500 text-white rounded-lg hover:bg-orange-600 flex items-center justify-center space-x-2"
      >
        <Bug size={16} />
        <span>Executar Diagnóstico</span>
      </button>

      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <p className="text-xs text-gray-600 text-center">
          💡 Se o backend estiver offline, execute: <br/>
          <code className="bg-gray-800 text-white px-1 rounded">python3 start_backend.py</code>
        </p>
      </div>
    </div>
  )
}

export default BackendDebug
