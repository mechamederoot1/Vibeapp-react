import React, { useState } from 'react'
import { ChevronLeft, ChevronRight, Eye, EyeOff, Check, CheckCircle, AlertCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import VibeLogoSimple from '../components/VibeLogoSimple'

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
    console.log(`📝 Input change: ${field} = "${value}"`)
    setFormData(prev => ({ ...prev, [field]: value }))
    setError('')
  }

  const getFieldError = (field) => {
    // Só mostrar erros se há erro ativo e o step foi validado
    if (!error) return null

    // Verificar se o campo específico tem erro
    switch (currentStep) {
      case 1:
        if (field === 'firstName' && formData.firstName.trim().length === 0) return 'Nome é obrigatório'
        if (field === 'lastName' && formData.lastName.trim().length === 0) return 'Sobrenome é obrigatório'
        break
      case 2:
        if (field === 'email') {
          const email = formData.email.trim()
          if (email.length === 0) return 'Email é obrigatório'
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          if (!emailRegex.test(email)) return 'Digite um email válido (ex: nome@email.com)'
        }
        break
      case 3:
        if (field === 'gender' && formData.gender.length === 0) return 'Selecione seu gênero'
        if (field === 'birthDate' && formData.birthDate.length === 0) return 'Digite sua data de nascimento'
        break
      case 4:
        if (field === 'password' && formData.password.length < 6) return 'A senha deve ter pelo menos 6 caracteres'
        if (field === 'confirmPassword' && formData.password !== formData.confirmPassword) return 'As senhas devem ser iguais'
        break
    }
    return null
  }

  const isFieldValid = (field) => {
    switch (field) {
      case 'firstName':
        return formData.firstName.trim().length > 0
      case 'lastName':
        return formData.lastName.trim().length > 0
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        const email = formData.email.trim()
        return email.length > 0 && emailRegex.test(email)
      case 'gender':
        return formData.gender.length > 0
      case 'birthDate':
        return formData.birthDate.length > 0
      case 'password':
        return formData.password.length >= 6
      case 'confirmPassword':
        return formData.confirmPassword.length > 0 && formData.password === formData.confirmPassword
      default:
        return false
    }
  }

  const getFieldClassName = (field) => {
    const hasError = getFieldError(field)
    const isValid = isFieldValid(field)
    const fieldValue = formData[field]

    if (hasError) {
      return 'border-red-500 focus:border-red-500 bg-red-50'
    } else if (isValid && fieldValue && fieldValue.length > 0) {
      return 'border-green-500 focus:border-green-500 bg-green-50'
    } else {
      return 'border-gray-300 focus:border-vibe-blue'
    }
  }

  const getFieldIcon = (field) => {
    const hasError = getFieldError(field)
    const isValid = isFieldValid(field)
    const fieldValue = formData[field]

    if (hasError) {
      return <AlertCircle className="text-red-500" size={20} />
    } else if (isValid && fieldValue && fieldValue.length > 0) {
      return <CheckCircle className="text-green-500" size={20} />
    }
    return null
  }

  const validateStep = (step) => {
    console.log(`🔍 Validating step ${step} with data:`, formData)

    switch (step) {
      case 1:
        const step1Valid = formData.firstName.trim().length > 0 && formData.lastName.trim().length > 0
        console.log(`Step 1 validation: ${step1Valid}`, { firstName: formData.firstName, lastName: formData.lastName })
        return step1Valid
      case 2:
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        const email = formData.email.trim()
        const step2Valid = email.length > 0 && emailRegex.test(email)
        console.log(`Step 2 validation: ${step2Valid}`, { email: formData.email, trimmed: email, regexTest: emailRegex.test(email) })
        return step2Valid
      case 3:
        const step3Valid = formData.gender.length > 0 && formData.birthDate.length > 0
        console.log(`Step 3 validation: ${step3Valid}`, { gender: formData.gender, birthDate: formData.birthDate })
        return step3Valid
      case 4:
        const step4Valid = (
          formData.password.length >= 6 &&
          formData.confirmPassword.length > 0 &&
          formData.password === formData.confirmPassword &&
          acceptedTerms
        )
        console.log(`Step 4 validation: ${step4Valid}`, {
          passwordLength: formData.password.length,
          confirmPasswordLength: formData.confirmPassword.length,
          passwordsMatch: formData.password === formData.confirmPassword,
          acceptedTerms
        })
        return step4Valid
      default:
        return false
    }
  }

  const getStepErrorMessage = (step) => {
    switch (step) {
      case 1:
        if (!formData.firstName.trim()) return 'Por favor, digite seu nome'
        if (!formData.lastName.trim()) return 'Por favor, digite seu sobrenome'
        return 'Por favor, preencha seu nome e sobrenome'
      case 2:
        if (!formData.email.trim()) return 'Por favor, digite seu email'
        return 'Por favor, digite um email válido'
      case 3:
        if (!formData.gender) return 'Por favor, selecione seu gênero'
        if (!formData.birthDate) return 'Por favor, digite sua data de nascimento'
        return 'Por favor, preencha suas informações pessoais'
      case 4:
        if (formData.password.length < 6) return 'A senha deve ter pelo menos 6 caracteres'
        if (formData.password !== formData.confirmPassword) return 'As senhas não coincidem'
        if (!acceptedTerms) return 'Você precisa aceitar os termos de uso'
        return 'Por favor, verifique todos os campos'
      default:
        return 'Por favor, preencha todos os campos obrigatórios'
    }
  }

  const nextStep = () => {
    console.log(`🚀 Trying to go to next step from ${currentStep}`)
    if (validateStep(currentStep)) {
      setError('')
      setCurrentStep(prev => Math.min(prev + 1, totalSteps))
    } else {
      const errorMessage = getStepErrorMessage(currentStep)
      console.log(`❌ Validation failed for step ${currentStep}: ${errorMessage}`)
      setError(errorMessage)
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
              <div>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Nome"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    className={`w-full p-4 border rounded-lg focus:outline-none transition-colors pr-12 ${getFieldClassName('firstName')}`}
                  />
                  {getFieldIcon('firstName') && (
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                      {getFieldIcon('firstName')}
                    </div>
                  )}
                </div>
                {getFieldError('firstName') && (
                  <p className="text-red-500 text-sm mt-1">{getFieldError('firstName')}</p>
                )}
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Sobrenome"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  className={`w-full p-4 border rounded-lg focus:outline-none transition-colors ${getFieldClassName('lastName')}`}
                />
                {getFieldError('lastName') && (
                  <p className="text-red-500 text-sm mt-1">{getFieldError('lastName')}</p>
                )}
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-center mb-6">Qual é o seu email?</h2>
            <div>
              <input
                type="email"
                placeholder="seu@email.com"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={`w-full p-4 border rounded-lg focus:outline-none transition-colors ${getFieldClassName('email')}`}
              />
              {getFieldError('email') && (
                <p className="text-red-500 text-sm mt-1">{getFieldError('email')}</p>
              )}
            </div>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">G��nero</label>
                <select
                  value={formData.gender}
                  onChange={(e) => handleInputChange('gender', e.target.value)}
                  className={`w-full p-4 border rounded-lg focus:outline-none transition-colors ${getFieldClassName('gender')}`}
                >
                  <option value="">Selecione seu gênero</option>
                  <option value="male">Masculino</option>
                  <option value="female">Feminino</option>
                  <option value="other">Outro</option>
                  <option value="prefer_not_to_say">Prefiro não dizer</option>
                </select>
                {getFieldError('gender') && (
                  <p className="text-red-500 text-sm mt-1">{getFieldError('gender')}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Data de nascimento</label>
                <input
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) => handleInputChange('birthDate', e.target.value)}
                  max={new Date(Date.now() - 13 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                  className={`w-full p-4 border rounded-lg focus:outline-none transition-colors ${getFieldClassName('birthDate')}`}
                />
                {getFieldError('birthDate') && (
                  <p className="text-red-500 text-sm mt-1">{getFieldError('birthDate')}</p>
                )}
              </div>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center mb-6">Crie sua senha</h2>
            <div className="space-y-4">
              <div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Senha (mínimo 6 caracteres)"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className={`w-full p-4 border rounded-lg focus:outline-none pr-12 transition-colors ${getFieldClassName('password')}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {getFieldError('password') && (
                  <p className="text-red-500 text-sm mt-1">{getFieldError('password')}</p>
                )}
              </div>
              <div>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirme sua senha"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className={`w-full p-4 border rounded-lg focus:outline-none pr-12 transition-colors ${getFieldClassName('confirmPassword')}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500"
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {getFieldError('confirmPassword') && (
                  <p className="text-red-500 text-sm mt-1">{getFieldError('confirmPassword')}</p>
                )}
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
    <div className="auth-container p-4 md:p-8">
      <div className="auth-card max-w-md rounded-lg md:rounded-lg p-6 md:p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <VibeLogoSimple size="lg" />
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
              disabled={!validateStep(currentStep)}
              className={`flex items-center space-x-2 px-6 py-2 rounded-lg transition-all ${
                validateStep(currentStep)
                  ? 'bg-vibe-blue text-white hover:bg-vibe-blue-dark'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
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
