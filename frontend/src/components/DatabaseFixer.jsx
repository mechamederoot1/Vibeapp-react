import React, { useState } from 'react'
import { Database, RefreshCw, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import axios from 'axios'

const DatabaseFixer = () => {
  const [isFixing, setIsFixing] = useState(false)
  const [fixResult, setFixResult] = useState(null)
  const [logs, setLogs] = useState([])

  const addLog = (message, type = 'info') => {
    setLogs(prev => [...prev, { message, type, timestamp: new Date().toLocaleTimeString() }])
  }

  const fixDatabase = async () => {
    setIsFixing(true)
    setFixResult(null)
    setLogs([])
    
    addLog('Iniciando correção do banco de dados...', 'info')

    try {
      // First check if backend is accessible
      addLog('Verificando conexão com backend...', 'info')
      
      try {
        await axios.get('/api/health', { timeout: 5000 })
        addLog('✅ Backend acessível', 'success')
      } catch (error) {
        addLog('❌ Backend não acessível - certifique-se que está rodando na porta 8000', 'error')
        setFixResult({ success: false, error: 'Backend offline' })
        setIsFixing(false)
        return
      }

      // Try to run the migration
      addLog('Executando migração do banco de dados...', 'info')
      
      const response = await axios.post('/api/dev/migrate-database', {}, { 
        timeout: 15000 
      })
      
      if (response.data.success) {
        addLog('✅ Migração executada com sucesso!', 'success')
        addLog(`📊 ${response.data.total_applied} alterações aplicadas`, 'info')
        
        // Log individual migrations
        response.data.applied_migrations.forEach(migration => {
          addLog(`  • ${migration}`, 'success')
        })
        
        setFixResult({ 
          success: true, 
          message: 'Banco de dados corrigido com sucesso!',
          details: response.data
        })
      } else {
        addLog('❌ Erro durante migração', 'error')
        addLog(response.data.error, 'error')
        setFixResult({ 
          success: false, 
          error: response.data.error,
          details: response.data
        })
      }
      
    } catch (error) {
      const errorMsg = error.response?.data?.detail || error.message
      addLog(`❌ Erro: ${errorMsg}`, 'error')
      setFixResult({ 
        success: false, 
        error: errorMsg 
      })
    }
    
    setIsFixing(false)
  }

  const testDatabaseAccess = async () => {
    addLog('Testando acesso ao banco de dados...', 'info')
    
    try {
      const response = await axios.get('/api/posts/feed?page=1&limit=5', { timeout: 10000 })
      addLog('✅ Banco de dados acessível - teste de posts executado', 'success')
      addLog(`📊 Encontrados ${response.data.posts?.length || 0} posts`, 'info')
    } catch (error) {
      if (error.message.includes('background_color')) {
        addLog('❌ Erro de coluna faltando detectado - execute a correção', 'error')
      } else {
        addLog(`❌ Erro ao acessar banco: ${error.message}`, 'error')
      }
    }
  }

  const getLogIcon = (type) => {
    switch (type) {
      case 'success': return <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
      case 'error': return <XCircle size={14} className="text-red-500 flex-shrink-0" />
      case 'warning': return <AlertTriangle size={14} className="text-yellow-500 flex-shrink-0" />
      default: return <div className="w-3.5 h-3.5 rounded-full bg-blue-500 flex-shrink-0" />
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <Database size={32} className="text-white" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Corretor de Banco de Dados</h2>
        <p className="text-gray-600 text-sm">
          Corrija erros de colunas faltantes no banco de dados
        </p>
      </div>

      {/* Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <button
          onClick={fixDatabase}
          disabled={isFixing}
          className="flex-1 py-3 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          {isFixing ? (
            <RefreshCw size={16} className="animate-spin" />
          ) : (
            <Database size={16} />
          )}
          <span>{isFixing ? 'Corrigindo...' : 'Corrigir Banco de Dados'}</span>
        </button>
        
        <button
          onClick={testDatabaseAccess}
          disabled={isFixing}
          className="py-3 px-4 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          <CheckCircle size={16} />
          <span>Testar Acesso</span>
        </button>
      </div>

      {/* Result */}
      {fixResult && (
        <div className={`p-4 rounded-lg mb-4 ${
          fixResult.success 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-center space-x-2 mb-2">
            {fixResult.success ? (
              <CheckCircle size={20} className="text-green-500" />
            ) : (
              <XCircle size={20} className="text-red-500" />
            )}
            <span className={`font-medium ${
              fixResult.success ? 'text-green-800' : 'text-red-800'
            }`}>
              {fixResult.success ? 'Sucesso!' : 'Erro'}
            </span>
          </div>
          <p className={`text-sm ${
            fixResult.success ? 'text-green-700' : 'text-red-700'
          }`}>
            {fixResult.message || fixResult.error}
          </p>
        </div>
      )}

      {/* Logs */}
      {logs.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-3">Log de Execução</h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {logs.map((log, index) => (
              <div key={index} className="flex items-start space-x-2 text-sm">
                {getLogIcon(log.type)}
                <span className="text-gray-500 text-xs flex-shrink-0">{log.timestamp}</span>
                <span className="flex-1">{log.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-medium text-blue-900 mb-2">Como usar:</h3>
        <ol className="text-sm text-blue-800 space-y-1">
          <li>1. <strong>Testar Acesso</strong>: Verifica se o erro está presente</li>
          <li>2. <strong>Corrigir Banco</strong>: Aplica as correções necessárias</li>
          <li>3. Recarregue a página para verificar se os erros foram resolvidos</li>
        </ol>
      </div>
    </div>
  )
}

export default DatabaseFixer
