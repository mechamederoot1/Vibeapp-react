import React, { useState } from 'react'
import { Users, Plus, CheckCircle, XCircle, Database } from 'lucide-react'
import { devAPI } from '../services/api'
import DatabaseMigration from './DatabaseMigration'

const CreateTestUsers = () => {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const handleCreateUsers = async () => {
    setLoading(true)
    setResult(null)
    setError(null)

    try {
      const response = await devAPI.createTestUsers()
      setResult(response.data)
      console.log('Usuários teste criados:', response.data)
    } catch (err) {
      console.error('Erro ao criar usuários teste:', err)
      setError(err.response?.data?.detail || 'Erro ao criar usuários teste')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-vibe-blue rounded-full flex items-center justify-center mx-auto mb-4">
          <Users size={32} className="text-white" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Usuários Teste</h2>
        <p className="text-gray-600 text-sm">
          Crie usuários teste para experimentar as funcionalidades da rede social
        </p>
      </div>

      <button
        onClick={handleCreateUsers}
        disabled={loading}
        className={`
          w-full py-3 px-4 rounded-lg font-medium flex items-center justify-center space-x-2
          ${loading 
            ? 'bg-gray-300 cursor-not-allowed' 
            : 'bg-vibe-blue hover:bg-vibe-blue-dark text-white'
          }
          transition-colors
        `}
      >
        {loading ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Criando usuários...</span>
          </>
        ) : (
          <>
            <Plus size={20} />
            <span>Criar Usuários Teste</span>
          </>
        )}
      </button>

      {result && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-2 mb-3">
            <CheckCircle size={20} className="text-green-600" />
            <h3 className="font-medium text-green-800">Sucesso!</h3>
          </div>
          <p className="text-green-700 text-sm mb-3">{result.message}</p>
          
          <div className="bg-white rounded-lg p-3 mb-3">
            <h4 className="font-medium text-gray-900 mb-2">Informações de Login:</h4>
            <p className="text-sm text-gray-600 mb-1">
              📧 <strong>Email:</strong> Qualquer email dos usuários criados
            </p>
            <p className="text-sm text-gray-600">
              🔐 <strong>Senha:</strong> {result.login_info?.password || 'senha123'}
            </p>
          </div>

          {result.users && result.users.length > 0 && (
            <div className="bg-white rounded-lg p-3">
              <h4 className="font-medium text-gray-900 mb-2">Usuários Criados ({result.users.length}):</h4>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {result.users.map((user, index) => (
                  <div key={index} className="text-xs text-gray-600 bg-gray-50 rounded p-2">
                    <div className="font-medium">{user.fullName} (@{user.username})</div>
                    <div className="text-gray-500">{user.email}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="mt-6 space-y-4">
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <XCircle size={20} className="text-red-600" />
              <h3 className="font-medium text-red-800">Erro</h3>
            </div>
            <p className="text-red-700 text-sm">{error}</p>
          </div>

          {/* Mostrar migração se for erro de coluna */}
          {(error.includes('no such column') || error.includes('background_color') || error.includes('profile_update_type')) && (
            <div>
              <div className="text-center mb-4">
                <h4 className="font-medium text-gray-900 mb-2">Solução:</h4>
                <p className="text-sm text-gray-600">Execute a migração do banco de dados abaixo</p>
              </div>
              <DatabaseMigration />
            </div>
          )}
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          💡 Depois de criar os usuários, você pode fazer logout e testar o login com qualquer um dos emails criados
        </p>
      </div>
    </div>
  )
}

export default CreateTestUsers
