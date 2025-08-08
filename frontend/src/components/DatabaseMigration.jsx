import React, { useState } from 'react'
import { Database, Play, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import { devAPI } from '../services/api'

const DatabaseMigration = () => {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const handleMigration = async () => {
    setLoading(true)
    setResult(null)
    setError(null)

    try {
      const response = await devAPI.migrateDatabase()
      setResult(response.data)
      console.log('Migração executada:', response.data)
    } catch (err) {
      console.error('Erro na migração:', err)
      setError(err.response?.data?.detail || 'Erro ao executar migração')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <Database size={32} className="text-white" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Migração do Banco</h2>
        <p className="text-gray-600 text-sm">
          Execute para corrigir o erro de colunas não encontradas
        </p>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
        <div className="flex items-start space-x-2">
          <AlertTriangle size={16} className="text-yellow-600 mt-0.5" />
          <div className="text-sm text-yellow-800">
            <p className="font-medium">Atenção:</p>
            <p className="text-xs mt-1">
              Esta operação irá atualizar o esquema do banco de dados para adicionar as novas colunas necessárias.
            </p>
          </div>
        </div>
      </div>

      <button
        onClick={handleMigration}
        disabled={loading}
        className={`
          w-full py-3 px-4 rounded-lg font-medium flex items-center justify-center space-x-2
          ${loading 
            ? 'bg-gray-300 cursor-not-allowed' 
            : 'bg-yellow-500 hover:bg-yellow-600 text-white'
          }
          transition-colors
        `}
      >
        {loading ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Executando migração...</span>
          </>
        ) : (
          <>
            <Play size={20} />
            <span>Executar Migração</span>
          </>
        )}
      </button>

      {result && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-2 mb-3">
            <CheckCircle size={20} className="text-green-600" />
            <h3 className="font-medium text-green-800">Migração Concluída!</h3>
          </div>
          
          <p className="text-green-700 text-sm mb-3">{result.message}</p>
          
          {result.applied_migrations && result.applied_migrations.length > 0 && (
            <div className="bg-white rounded-lg p-3">
              <h4 className="font-medium text-gray-900 mb-2">
                Alterações Aplicadas ({result.total_applied}):
              </h4>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {result.applied_migrations.map((migration, index) => (
                  <div 
                    key={index} 
                    className={`text-xs p-2 rounded ${
                      migration.startsWith('ERRO:') 
                        ? 'bg-red-50 text-red-700' 
                        : 'bg-gray-50 text-gray-700'
                    }`}
                  >
                    {migration}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="mt-3 text-center">
            <button
              onClick={() => window.location.reload()}
              className="text-green-600 text-sm font-medium hover:text-green-700"
            >
              Recarregar página para aplicar mudanças
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <XCircle size={20} className="text-red-600" />
            <h3 className="font-medium text-red-800">Erro na Migração</h3>
          </div>
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          💡 Após a migração, o erro de "no such column" será resolvido
        </p>
      </div>
    </div>
  )
}

export default DatabaseMigration
