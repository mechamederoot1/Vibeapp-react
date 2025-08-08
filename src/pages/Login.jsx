import React, { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

const Login = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [isLogin, setIsLogin] = useState(true)

  return (
    <div className="min-h-screen bg-gradient-to-br from-vibe-blue-light to-vibe-blue flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Vibe</h1>
          <p className="text-blue-100">Conecte-se com o mundo</p>
        </div>

        {/* Formulário */}
        <div className="bg-white rounded-2xl p-6 shadow-xl">
          <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
            {isLogin ? 'Entrar' : 'Criar Conta'}
          </h2>

          <form className="space-y-4">
            {!isLogin && (
              <div>
                <input
                  type="text"
                  placeholder="Nome completo"
                  className="input-field"
                />
              </div>
            )}
            
            <div>
              <input
                type="email"
                placeholder="E-mail ou telefone"
                className="input-field"
              />
            </div>

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Senha"
                className="input-field pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
              >
                {showPassword ? (
                  <EyeOff size={20} className="text-gray-400" />
                ) : (
                  <Eye size={20} className="text-gray-400" />
                )}
              </button>
            </div>

            {!isLogin && (
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Confirmar senha"
                  className="input-field pr-10"
                />
              </div>
            )}

            <button
              type="submit"
              className="w-full btn-primary py-3 text-lg font-semibold"
            >
              {isLogin ? 'Entrar' : 'Criar Conta'}
            </button>
          </form>

          {isLogin && (
            <div className="text-center mt-4">
              <a href="#" className="text-vibe-blue text-sm font-medium">
                Esqueceu a senha?
              </a>
            </div>
          )}

          <div className="mt-6 text-center">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">ou</span>
              </div>
            </div>
          </div>

          <button className="w-full mt-4 btn-secondary py-3 text-lg font-semibold">
            Continuar com Google
          </button>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              {isLogin ? 'Não tem uma conta?' : 'Já tem uma conta?'}
              {' '}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-vibe-blue font-semibold"
              >
                {isLogin ? 'Cadastre-se' : 'Faça login'}
              </button>
            </p>
          </div>
        </div>

        {/* Download do App */}
        <div className="mt-8 text-center">
          <p className="text-blue-100 text-sm mb-4">Baixe o app</p>
          <div className="flex space-x-3 justify-center">
            <div className="bg-white bg-opacity-20 rounded-lg px-4 py-2">
              <span className="text-white text-sm">📱 App Store</span>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg px-4 py-2">
              <span className="text-white text-sm">🤖 Google Play</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
