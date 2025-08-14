import React, { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import VibeLogoSimple, { VibeLogoCircular } from '../components/VibeLogoSimple'

const LoginPage = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!email || !password) {
      setError('Por favor, preencha todos os campos')
      return
    }

    setLoading(true)
    setError('')

    const result = await login(email, password)
    
    if (result.success) {
      navigate('/feed')
    } else {
      setError(result.error)
    }
    
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 md:p-4">
      <div className="max-w-md w-full bg-white rounded-lg md:shadow-lg p-8 md:rounded-lg h-screen md:h-auto flex flex-col justify-center">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mb-6 flex justify-center">
            <VibeLogoCircular size="xl" />
          </div>
          <p className="text-gray-600 text-center mt-4">Entre na sua conta</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setError('')
              }}
              className="w-full p-4 border border-gray-300 rounded-lg focus:border-vibe-blue focus:outline-none"
              required
            />
          </div>

          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Senha"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setError('')
              }}
              className="w-full p-4 border border-gray-300 rounded-lg focus:border-vibe-blue focus:outline-none pr-12"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {/* Error message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-vibe-blue text-white py-4 rounded-lg hover:bg-vibe-blue-dark disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        {/* Forgot password */}
        <div className="text-center mt-6">
          <button className="text-vibe-blue hover:underline text-sm">
            Esqueceu sua senha?
          </button>
        </div>

        {/* Sign up link */}
        <div className="text-center">
          <p className="text-gray-600 text-center">
            Não tem uma conta?{' '}
            <button
              onClick={() => navigate('/register')}
              className="text-vibe-blue hover:underline font-medium"
            >
              Criar conta
            </button>
          </p>
        </div>

      </div>
    </div>
  )
}

export default LoginPage
