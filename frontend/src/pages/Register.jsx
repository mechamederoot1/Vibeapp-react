import React, { useState } from 'react'
import { ChevronLeft, ChevronRight, Eye, EyeOff, Check } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { VibeLogoSound } from '../components/VibeLogoGeometric'

const Register = () => {
  const [currentStep, setCurrentStep] = useState(1)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [showTerms, setShowTerms] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const { register } = useAuth()
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    gender: '',
    birthDate: '',
    password: '',
    confirmPassword: ''
  })

  const totalSteps = 4

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError('')
  }

  const validateStep = (step) => {
    switch (step) {
      case 1:
        return formData.firstName.trim() && formData.lastName.trim()
      case 2:
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return emailRegex.test(formData.email)
      case 3:
        return formData.gender && formData.birthDate
      case 4:
        return (
          formData.password.length >= 6 &&
          formData.password === formData.confirmPassword &&
          acceptedTerms
        )
      default:
        return false
    }
  }

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps))
    } else {
      setError('Por favor, preencha todos os campos obrigatórios')
    }
  }

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const handleSubmit = async () => {
    if (!validateStep(4)) {
      setError('Por favor, verifique todos os campos')
      return
    }

    setLoading(true)
    setError('')

    const result = await register({
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      gender: formData.gender,
      birthDate: formData.birthDate,
      password: formData.password
    })

    if (result.success) {
      navigate('/feed')
    } else {
      setError(result.error)
    }
    
    setLoading(false)
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-center mb-6">Qual é o seu nome?</h2>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Nome"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                className="w-full p-4 border border-gray-300 rounded-lg focus:border-vibe-blue focus:outline-none"
              />
              <input
                type="text"
                placeholder="Sobrenome"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                className="w-full p-4 border border-gray-300 rounded-lg focus:border-vibe-blue focus:outline-none"
              />
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-center mb-6">Qual é o seu email?</h2>
            <input
              type="email"
              placeholder="seu@email.com"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className="w-full p-4 border border-gray-300 rounded-lg focus:border-vibe-blue focus:outline-none"
            />
            <p className="text-gray-500 text-sm text-center">
              Usaremos este email para enviar atualizações importantes
            </p>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center mb-6">Informações pessoais</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Gênero</label>
                <select
                  value={formData.gender}
                  onChange={(e) => handleInputChange('gender', e.target.value)}
                  className="w-full p-4 border border-gray-300 rounded-lg focus:border-vibe-blue focus:outline-none"
                >
                  <option value="">Selecione seu gênero</option>
                  <option value="male">Masculino</option>
                  <option value="female">Feminino</option>
                  <option value="other">Outro</option>
                  <option value="prefer_not_to_say">Prefiro não dizer</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Data de nascimento</label>
                <input
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) => handleInputChange('birthDate', e.target.value)}
                  max={new Date(Date.now() - 13 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                  className="w-full p-4 border border-gray-300 rounded-lg focus:border-vibe-blue focus:outline-none"
                />
              </div>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center mb-6">Crie sua senha</h2>
            <div className="space-y-4">
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Senha (mínimo 6 caracteres)"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="w-full p-4 border border-gray-300 rounded-lg focus:border-vibe-blue focus:outline-none pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirme sua senha"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  className="w-full p-4 border border-gray-300 rounded-lg focus:border-vibe-blue focus:outline-none pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              
              <div className="space-y-3 mt-6">
                <div className="flex items-start space-x-3">
                  <button
                    type="button"
                    onClick={() => setAcceptedTerms(!acceptedTerms)}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5 ${
                      acceptedTerms ? 'bg-vibe-blue border-vibe-blue' : 'border-gray-300'
                    }`}
                  >
                    {acceptedTerms && <Check size={14} className="text-white" />}
                  </button>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Concordo com os{' '}
                    <button
                      type="button"
                      onClick={() => setShowTerms(true)}
                      className="text-vibe-blue hover:underline"
                    >
                      Termos de Uso e Política de Privacidade
                    </button>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="bg-gradient-to-r from-vibe-blue to-vibe-blue-dark rounded-xl p-3 mx-auto mb-4 w-16 h-16 flex items-center justify-center">
            <VibeLogo size="md" className="text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-vibe-blue to-vibe-blue-dark bg-clip-text text-transparent">Vibe</h1>
        </div>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-500 mb-2">
            <span>Etapa {currentStep}</span>
            <span>{currentStep} de {totalSteps}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-vibe-blue h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Form content */}
        {renderStep()}

        {/* Error message */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex justify-between mt-8">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
              currentStep === 1
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <ChevronLeft size={20} />
            <span>Voltar</span>
          </button>

          {currentStep < totalSteps ? (
            <button
              onClick={nextStep}
              className="flex items-center space-x-2 bg-vibe-blue text-white px-6 py-2 rounded-lg hover:bg-vibe-blue-dark"
            >
              <span>Próximo</span>
              <ChevronRight size={20} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading || !validateStep(4)}
              className="bg-vibe-blue text-white px-6 py-2 rounded-lg hover:bg-vibe-blue-dark disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Criando conta...' : 'Criar conta'}
            </button>
          )}
        </div>

        {/* Login link */}
        <div className="text-center mt-6">
          <p className="text-gray-600">
            Já tem uma conta?{' '}
            <button
              onClick={() => navigate('/login')}
              className="text-vibe-blue hover:underline"
            >
              Fazer login
            </button>
          </p>
        </div>
      </div>

      {/* Terms Modal */}
      {showTerms && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">Termos de Uso e Política de Privacidade</h2>
              
              <div className="space-y-4 text-sm text-gray-700">
                <section>
                  <h3 className="font-semibold text-lg mb-2">1. Termos de Uso</h3>
                  <p>
                    Ao usar o Vibe Social, você concorda em seguir nossas diretrizes da comunidade e usar a plataforma de forma respeitosa e legal.
                  </p>
                </section>

                <section>
                  <h3 className="font-semibold text-lg mb-2">2. Privacidade dos Dados</h3>
                  <p>
                    Seus dados pessoais são protegidos e utilizados apenas para melhorar sua experiência na plataforma. Não compartilhamos suas informações pessoais com terceiros sem seu consentimento.
                  </p>
                </section>

                <section>
                  <h3 className="font-semibold text-lg mb-2">3. Conteúdo do Usuário</h3>
                  <p>
                    Você é responsável pelo conteúdo que publica. Não permitimos spam, discurso de ódio, ou conteúdo ilegal.
                  </p>
                </section>

                <section>
                  <h3 className="font-semibold text-lg mb-2">4. Segurança</h3>
                  <p>
                    Implementamos medidas de segurança para proteger sua conta. Use uma senha forte e não compartilhe suas credenciais.
                  </p>
                </section>

                <section>
                  <h3 className="font-semibold text-lg mb-2">5. Modificações</h3>
                  <p>
                    Podemos atualizar estes termos ocasionalmente. Notificaremos sobre mudanças significativas.
                  </p>
                </section>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowTerms(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Fechar
                </button>
                <button
                  onClick={() => {
                    setAcceptedTerms(true)
                    setShowTerms(false)
                  }}
                  className="px-4 py-2 bg-vibe-blue text-white rounded-lg hover:bg-vibe-blue-dark"
                >
                  Aceitar Termos
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Register
