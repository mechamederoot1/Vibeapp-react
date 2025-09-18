import React, { useState, useRef } from 'react'
import { X, Camera, Save, User, Mail, Calendar, MapPin, Globe, Phone, Heart } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { personalInfoAPI } from '../services/api'

const ProfileEditModal = ({ isOpen, onClose, onUpdated }) => {
  const { user, updateProfile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const avatarInputRef = useRef(null)
  const coverInputRef = useRef(null)

  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    username: user?.username || '',
    email: user?.email || '',
    bio: user?.bio || '',
    location: user?.location || '',
    website: user?.website || '',
    phone: user?.phone || '',
    birthDate: user?.birthDate || '',
    gender: user?.gender || '',
    relationship: user?.relationship || '',
    avatar: user?.avatar || '',
    coverPhoto: user?.coverPhoto || ''
  })

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError('')
    setSuccess('')
  }

  const handleImageUpload = (field, file) => {
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        handleInputChange(field, e.target.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setError('Nome e sobrenome são obrigatórios')
      return
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Email inválido')
      return
    }

    setLoading(true)
    setError('')

    try {
      const profileResult = await updateProfile(formData)

      if (!profileResult.success) {
        setError(profileResult.error)
        setLoading(false)
        return
      }

      // Map overlapping fields to personal-info so the "Informações Pessoais" section reflects updates
      const piPayload = {
        location: {
          currentCity: formData.location || null,
          hometown: null,
          country: null,
        },
        contact: {
          websitePersonal: formData.website || null,
          websiteProfessional: null,
          phoneMobile: formData.phone || null,
          phoneWork: null,
        },
        additional: {
          languages: null,
          interests: null,
          aboutMe: formData.bio || null,
        }
      }
      try {
        await personalInfoAPI.update(piPayload)
      } catch (e) {
        // Non-blocking: if this fails, at least user profile is updated
        console.warn('Falha ao sincronizar informações pessoais:', e?.response?.data || e.message)
      }

      // Notify parent to refresh personal info section if provided
      if (onUpdated) {
        try { await onUpdated() } catch {}
      }

      setSuccess('Perfil atualizado com sucesso!')
      setTimeout(() => {
        onClose()
      }, 800)

    } catch (error) {
      console.error('Error saving profile:', error)
      setError('Erro ao salvar o perfil. Tente novamente.')
    }

    setLoading(false)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
      <div className="bg-white h-full w-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-xl font-bold">Editar Perfil</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
          <div className="flex-1 p-6 space-y-6 overflow-y-auto">
          {/* Cover Photo */}
          <div className="relative">
            <div className="w-full h-32 bg-gradient-to-br from-vibe-blue via-vibe-blue-light to-purple-300 rounded-lg relative overflow-hidden">
              {formData.coverPhoto && (
                <img 
                  src={formData.coverPhoto} 
                  alt="Capa"
                  className="w-full h-full object-cover"
                />
              )}
              <button
                type="button"
                onClick={() => coverInputRef.current?.click()}
                className="absolute inset-0 bg-black bg-opacity-30 hover:bg-opacity-50 flex items-center justify-center text-white transition-all"
              >
                <Camera size={24} />
              </button>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload('coverPhoto', e.target.files[0])}
                className="hidden"
              />
            </div>

            {/* Avatar */}
            <div className="absolute -bottom-6 left-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full border-4 border-white bg-gray-100 overflow-hidden">
                  {formData.avatar ? (
                    <img 
                      src={formData.avatar} 
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <User size={32} className="text-gray-400" />
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="absolute bottom-0 right-0 w-8 h-8 bg-vibe-blue rounded-full flex items-center justify-center border-2 border-white hover:bg-vibe-blue-dark"
                >
                  <Camera size={14} className="text-white" />
                </button>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload('avatar', e.target.files[0])}
                  className="hidden"
                />
              </div>
            </div>
          </div>

          {/* Basic Info */}
          <div className="pt-8 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome *
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:border-vibe-blue focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sobrenome *
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:border-vibe-blue focus:outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome de usuário
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                placeholder="@username"
                className="w-full p-3 border border-gray-300 rounded-lg focus:border-vibe-blue focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bio
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                placeholder="Conte um pouco sobre você..."
                rows={3}
                maxLength={160}
                className="w-full p-3 border border-gray-300 rounded-lg focus:border-vibe-blue focus:outline-none resize-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.bio.length}/160 caracteres
              </p>
            </div>

            {/* Contact Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail size={16} className="inline mr-1" />
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:border-vibe-blue focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone size={16} className="inline mr-1" />
                  Telefone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="(11) 99999-9999"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:border-vibe-blue focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin size={16} className="inline mr-1" />
                  Localização
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="São Paulo, Brasil"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:border-vibe-blue focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Globe size={16} className="inline mr-1" />
                  Website
                </label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  placeholder="https://exemplo.com"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:border-vibe-blue focus:outline-none"
                />
              </div>
            </div>

            {/* Personal Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar size={16} className="inline mr-1" />
                  Data de nascimento
                </label>
                <input
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) => handleInputChange('birthDate', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:border-vibe-blue focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gênero
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => handleInputChange('gender', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:border-vibe-blue focus:outline-none"
                >
                  <option value="">Selecione</option>
                  <option value="male">Masculino</option>
                  <option value="female">Feminino</option>
                  <option value="other">Outro</option>
                  <option value="prefer_not_to_say">Prefiro não dizer</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Heart size={16} className="inline mr-1" />
                Relacionamento
              </label>
              <select
                value={formData.relationship}
                onChange={(e) => handleInputChange('relationship', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:border-vibe-blue focus:outline-none"
              >
                <option value="">Selecione</option>
                <option value="single">Solteiro(a)</option>
                <option value="in_a_relationship">Em um relacionamento</option>
                <option value="married">Casado(a)</option>
                <option value="its_complicated">É complicado</option>
                <option value="prefer_not_to_say">Prefiro não dizer</option>
              </select>
            </div>

            {/* Note about detailed editing */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-blue-800 text-sm">
                💡 <strong>Dica:</strong> Para editar informações detalhadas de trabalho, educação e outras informações pessoais, 
                use o botão "Editar" na seção "Informações Pessoais" do seu perfil.
              </p>
            </div>
          </div>

          {/* Messages */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-600 text-sm">{success}</p>
            </div>
          )}

          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2 bg-vibe-blue text-white px-6 py-2 rounded-lg hover:bg-vibe-blue-dark disabled:opacity-50"
            >
              <Save size={16} />
              <span>{loading ? 'Salvando...' : 'Salvar'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ProfileEditModal
