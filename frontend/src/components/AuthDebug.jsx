import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { authAPI, devAPI, storiesAPI } from '../services/api'

const AuthDebug = () => {
  const { user, isAuthenticated } = useAuth()
  const [debugInfo, setDebugInfo] = useState('')
  const [loading, setLoading] = useState(false)

  const addLog = (message) => {
    console.log(message)
    setDebugInfo(prev => prev + '\n' + new Date().toLocaleTimeString() + ': ' + message)
  }

  const clearLogs = () => {
    setDebugInfo('')
  }

  const testToken = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      addLog(`Token from localStorage: ${token ? token.substring(0, 30) + '...' : 'NULL'}`)
      
      if (token) {
        const response = await authAPI.me()
        addLog(`✅ Token is valid! User: ${response.data.email}`)
      } else {
        addLog('❌ No token found')
      }
    } catch (error) {
      addLog(`❌ Token test failed: ${error.message}`)
      if (error.response) {
        addLog(`Response: ${error.response.status} - ${JSON.stringify(error.response.data)}`)
      }
    }
    setLoading(false)
  }

  const createTestUsers = async () => {
    setLoading(true)
    try {
      addLog('🔧 Creating test users...')
      const response = await devAPI.createTestUsers()
      addLog(`✅ Test users created: ${response.data.users_created} users`)
      addLog(`Login info: Use any email with password "senha123"`)
    } catch (error) {
      addLog(`❌ Failed to create test users: ${error.message}`)
    }
    setLoading(false)
  }

  const testLogin = async () => {
    setLoading(true)
    try {
      addLog('🔑 Testing login with maria.silva@email.com...')
      const response = await authAPI.login('maria.silva@email.com', 'senha123')
      addLog(`✅ Login successful! Token: ${response.data.access_token.substring(0, 30)}...`)
      
      // Save token manually for testing
      localStorage.setItem('token', response.data.access_token)
      addLog('💾 Token saved to localStorage')
      
      window.location.reload() // Refresh to update auth context
    } catch (error) {
      addLog(`❌ Login failed: ${error.message}`)
      if (error.response) {
        addLog(`Response: ${error.response.status} - ${JSON.stringify(error.response.data)}`)
      }
    }
    setLoading(false)
  }

  const testStoryCreation = async () => {
    setLoading(true)
    try {
      addLog('🎬 Testing story creation...')
      const response = await storiesAPI.createStory({
        type: 'text',
        content: 'Test story from debug component',
        privacy: 'public',
        duration: 24
      })
      addLog(`✅ Story created successfully! ID: ${response.data.id}`)
    } catch (error) {
      addLog(`❌ Story creation failed: ${error.message}`)
      if (error.response) {
        addLog(`Response: ${error.response.status} - ${JSON.stringify(error.response.data)}`)
      }
    }
    setLoading(false)
  }

  return (
    <div className="fixed top-4 right-4 w-96 bg-white border border-gray-300 rounded-lg shadow-lg p-4 z-50 max-h-96 overflow-y-auto">
      <h3 className="font-bold text-lg mb-4">🔧 Auth Debug</h3>
      
      <div className="space-y-2 mb-4">
        <p><strong>User:</strong> {user ? user.email : 'Not logged in'}</p>
        <p><strong>Authenticated:</strong> {isAuthenticated ? '✅ Yes' : '❌ No'}</p>
        <p><strong>Token exists:</strong> {localStorage.getItem('token') ? '✅ Yes' : '❌ No'}</p>
      </div>

      <div className="space-y-2 mb-4">
        <button
          onClick={testToken}
          disabled={loading}
          className="w-full px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          Test Token
        </button>
        
        <button
          onClick={createTestUsers}
          disabled={loading}
          className="w-full px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
        >
          Create Test Users
        </button>
        
        <button
          onClick={testLogin}
          disabled={loading}
          className="w-full px-3 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
        >
          Test Login (Maria)
        </button>
        
        <button
          onClick={testStoryCreation}
          disabled={loading}
          className="w-full px-3 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50"
        >
          Test Story Creation
        </button>
        
        <button
          onClick={clearLogs}
          className="w-full px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Clear Logs
        </button>
      </div>

      <div className="border-t pt-4">
        <h4 className="font-semibold mb-2">Debug Logs:</h4>
        <textarea
          value={debugInfo}
          readOnly
          className="w-full h-32 p-2 border border-gray-300 rounded text-xs font-mono resize-none"
          placeholder="Logs will appear here..."
        />
      </div>
    </div>
  )
}

export default AuthDebug
