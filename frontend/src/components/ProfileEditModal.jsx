import React, { useState, useRef } from 'react'
import { X, Camera, Save, User, Mail, Calendar, MapPin, Globe, Phone, Briefcase, GraduationCap, Heart, Plus, Trash2, Building } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { workExperienceAPI, educationAPI, personalInfoAPI } from '../services/api'

const ProfileEditModal = ({ isOpen, onClose }) => {
  const { user, updateProfile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [dataLoading, setDataLoading] = useState(false)
  
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
    work: user?.work || '',
    education: user?.education || '',
    relationship: user?.relationship || '',
    currentCity: user?.currentCity || '',
    avatar: user?.avatar || '',
    coverPhoto: user?.coverPhoto || '',
    workExperiences: [],
    educationEntries: []
  })

  const [expandedSections, setExpandedSections] = useState({
    work: false,
    education: false
  })

  const [deletedItems, setDeletedItems] = useState({
    workExperiences: [],
    educationEntries: []
  })

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError('')
    setSuccess('')
  }

  // Work Experience Functions
  const addWorkExperience = () => {
    const newWork = {
      id: null,
      company: '',
      position: '',
      description: '',
      startDate: '',
      endDate: '',
      isCurrent: false,
      orderIndex: formData.workExperiences.length
    }
    setFormData(prev => ({
      ...prev,
      workExperiences: [...prev.workExperiences, newWork]
    }))
  }

  const removeWorkExperience = (index) => {
    const workToRemove = formData.workExperiences[index]
    if (workToRemove.id) {
      // Track for deletion if it has an ID (exists in backend)
      setDeletedItems(prev => ({
        ...prev,
        workExperiences: [...prev.workExperiences, workToRemove.id]
      }))
    }
    setFormData(prev => ({
      ...prev,
      workExperiences: prev.workExperiences.filter((_, i) => i !== index)
    }))
  }

  const updateWorkExperience = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      workExperiences: prev.workExperiences.map((work, i) =>
        i === index ? { ...work, [field]: value } : work
      )
    }))
  }

  // Education Functions
  const addEducation = () => {
    const newEducation = {
      id: null,
      institution: '',
      degree: '',
      field: '',
      description: '',
      startDate: '',
      endDate: '',
      isCurrent: false,
      orderIndex: formData.educationEntries.length
    }
    setFormData(prev => ({
      ...prev,
      educationEntries: [...prev.educationEntries, newEducation]
    }))
  }

  const removeEducation = (index) => {
    const educationToRemove = formData.educationEntries[index]
    if (educationToRemove.id) {
      // Track for deletion if it has an ID (exists in backend)
      setDeletedItems(prev => ({
        ...prev,
        educationEntries: [...prev.educationEntries, educationToRemove.id]
      }))
    }
    setFormData(prev => ({
      ...prev,
      educationEntries: prev.educationEntries.filter((_, i) => i !== index)
    }))
  }

  const updateEducation = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      educationEntries: prev.educationEntries.map((education, i) =>
        i === index ? { ...education, [field]: value } : education
      )
    }))
  }

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  // Load existing work experience and education data when modal opens
  React.useEffect(() => {
    const loadExistingData = async () => {
      if (!isOpen) return

      setDataLoading(true)
      try {
        // Load existing work experiences
        const workResponse = await workExperienceAPI.getAll()
        const workExperiences = workResponse.data || []

        // Load existing education entries
        const educationResponse = await educationAPI.getAll()
        const educationEntries = educationResponse.data || []

        // Load personal info for other fields
        const personalInfoResponse = await personalInfoAPI.get()
        const personalInfo = personalInfoResponse.data.personalInfo || {}

        setFormData(prev => ({
          ...prev,
          workExperiences: workExperiences.map(work => ({
            id: work.id,
            company: work.company || '',
            position: work.position || '',
            description: work.description || '',
            startDate: work.startDate || '',
            endDate: work.endDate || '',
            isCurrent: work.isCurrent || false,
            orderIndex: work.orderIndex || 0
          })),
          educationEntries: educationEntries.map(education => ({
            id: education.id,
            institution: education.institution || '',
            degree: education.degree || '',
            field: education.field || '',
            description: education.description || '',
            startDate: education.startDate || '',
            endDate: education.endDate || '',
            isCurrent: education.isCurrent || false,
            orderIndex: education.orderIndex || 0
          }))
        }))

        console.log('✅ Loaded existing data:')
        console.log('  💼 Work experiences:', workExperiences.length, workExperiences)
        console.log('  🎓 Education entries:', educationEntries.length, educationEntries)
      } catch (error) {
        console.error('❌ Error loading existing data:', error)
      } finally {
        setDataLoading(false)
      }
    }

    loadExistingData()
  }, [isOpen])

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
      // 1. Update basic profile information
      const profileResult = await updateProfile(formData)

      if (!profileResult.success) {
        setError(profileResult.error)
        setLoading(false)
        return
      }

      // 2. Delete removed work experiences
      for (const workId of deletedItems.workExperiences) {
        try {
          await workExperienceAPI.delete(workId)
        } catch (error) {
          console.error('Error deleting work experience:', error)
        }
      }

      // Delete removed education entries
      for (const educationId of deletedItems.educationEntries) {
        try {
          await educationAPI.delete(educationId)
        } catch (error) {
          console.error('Error deleting education entry:', error)
        }
      }

      // 3. Save work experiences
      console.log('💼 Saving work experiences:', formData.workExperiences)
      for (const work of formData.workExperiences) {
        if (work.company && work.position) {
          const workData = {
            company: work.company,
            position: work.position,
            description: work.description,
            start_date: work.startDate,
            end_date: work.endDate,
            is_current: work.isCurrent,
            order_index: work.orderIndex
          }

          if (work.id) {
            // Update existing
            console.log(`✏️ Updating work experience ${work.id}:`, workData)
            await workExperienceAPI.update(work.id, workData)
          } else {
            // Create new
            console.log('➕ Creating new work experience:', workData)
            const result = await workExperienceAPI.create(workData)
            console.log('✅ Work experience created:', result.data)
          }
        }
      }

      // 4. Save education entries
      console.log('🎓 Saving education entries:', formData.educationEntries)
      for (const education of formData.educationEntries) {
        if (education.institution && education.degree) {
          const educationData = {
            institution: education.institution,
            degree: education.degree,
            field: education.field,
            description: education.description,
            start_date: education.startDate,
            end_date: education.endDate,
            is_current: education.isCurrent,
            order_index: education.orderIndex
          }

          if (education.id) {
            // Update existing
            console.log(`✏️ Updating education ${education.id}:`, educationData)
            await educationAPI.update(education.id, educationData)
          } else {
            // Create new
            console.log('➕ Creating new education:', educationData)
            const result = await educationAPI.create(educationData)
            console.log('✅ Education created:', result.data)
          }
        }
      }

      setSuccess('Perfil e experiências atualizados com sucesso!')

      // Notify parent component to refresh data instead of full page reload
      if (typeof window !== 'undefined' && window.refreshProfileData) {
        window.refreshProfileData()
      }

      setTimeout(() => {
        onClose()
        // Only reload if parent refresh mechanism is not available
        if (typeof window === 'undefined' || !window.refreshProfileData) {
          window.location.reload()
        }
      }, 1500)

    } catch (error) {
      console.error('Error saving profile:', error)
      setError('Erro ao salvar o perfil. Tente novamente.')
    }

    setLoading(false)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold">Editar Perfil</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
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

            {/* Professional Info - Work Experience */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Briefcase size={20} className="text-vibe-blue" />
                  <h3 className="font-semibold text-gray-900">Experiência Profissional</h3>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={addWorkExperience}
                    className="flex items-center space-x-1 px-3 py-1 text-sm bg-vibe-blue text-white rounded-lg hover:bg-vibe-blue-dark"
                  >
                    <Plus size={14} />
                    <span>Adicionar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleSection('work')}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    {expandedSections.work ? '−' : '+'}
                  </button>
                </div>
              </div>

              {/* Simple work field (legacy) */}
              <div className="mb-4">
                <input
                  type="text"
                  value={formData.work}
                  onChange={(e) => handleInputChange('work', e.target.value)}
                  placeholder="Ex: Designer na Empresa XYZ (campo rápido)"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:border-vibe-blue focus:outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">Campo rápido - ou use a seção expandida abaixo</p>
              </div>

              {/* Expanded work experiences */}
              {expandedSections.work && (
                <div className="space-y-4">
                  {formData.workExperiences.map((work, index) => (
                    <div key={index} className="border border-gray-100 rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900">Experiência {index + 1}</h4>
                        <button
                          type="button"
                          onClick={() => removeWorkExperience(index)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <input
                            type="text"
                            value={work.company}
                            onChange={(e) => updateWorkExperience(index, 'company', e.target.value)}
                            placeholder="Empresa"
                            className="w-full p-2 border border-gray-300 rounded focus:border-vibe-blue focus:outline-none"
                          />
                        </div>
                        <div>
                          <input
                            type="text"
                            value={work.position}
                            onChange={(e) => updateWorkExperience(index, 'position', e.target.value)}
                            placeholder="Cargo"
                            className="w-full p-2 border border-gray-300 rounded focus:border-vibe-blue focus:outline-none"
                          />
                        </div>
                        <div>
                          <input
                            type="date"
                            value={work.startDate}
                            onChange={(e) => updateWorkExperience(index, 'startDate', e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded focus:border-vibe-blue focus:outline-none"
                          />
                        </div>
                        <div>
                          <input
                            type="date"
                            value={work.endDate}
                            onChange={(e) => updateWorkExperience(index, 'endDate', e.target.value)}
                            disabled={work.isCurrent}
                            className="w-full p-2 border border-gray-300 rounded focus:border-vibe-blue focus:outline-none disabled:bg-gray-100"
                          />
                        </div>
                      </div>

                      <div className="mt-3">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={work.isCurrent}
                            onChange={(e) => {
                              updateWorkExperience(index, 'isCurrent', e.target.checked)
                              if (e.target.checked) {
                                updateWorkExperience(index, 'endDate', '')
                              }
                            }}
                            className="w-4 h-4 text-vibe-blue border-gray-300 rounded focus:ring-vibe-blue"
                          />
                          <span className="text-sm text-gray-700">Trabalho atual</span>
                        </label>
                      </div>

                      <div className="mt-3">
                        <textarea
                          value={work.description}
                          onChange={(e) => updateWorkExperience(index, 'description', e.target.value)}
                          placeholder="Descrição das responsabilidades..."
                          rows={2}
                          className="w-full p-2 border border-gray-300 rounded focus:border-vibe-blue focus:outline-none resize-none"
                        />
                      </div>
                    </div>
                  ))}

                  {formData.workExperiences.length === 0 && (
                    <p className="text-center text-gray-500 py-4">
                      Nenhuma experiência adicionada. Clique em "Adicionar" para começar.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Education Info */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <GraduationCap size={20} className="text-vibe-blue" />
                  <h3 className="font-semibold text-gray-900">Formação Acadêmica</h3>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={addEducation}
                    className="flex items-center space-x-1 px-3 py-1 text-sm bg-vibe-blue text-white rounded-lg hover:bg-vibe-blue-dark"
                  >
                    <Plus size={14} />
                    <span>Adicionar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleSection('education')}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    {expandedSections.education ? '−' : '+'}
                  </button>
                </div>
              </div>

              {/* Simple education field (legacy) */}
              <div className="mb-4">
                <input
                  type="text"
                  value={formData.education}
                  onChange={(e) => handleInputChange('education', e.target.value)}
                  placeholder="Ex: Design Digital - UFPE (campo rápido)"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:border-vibe-blue focus:outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">Campo rápido - ou use a seção expandida abaixo</p>
              </div>

              {/* Expanded education entries */}
              {expandedSections.education && (
                <div className="space-y-4">
                  {formData.educationEntries.map((education, index) => (
                    <div key={index} className="border border-gray-100 rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900">Formação {index + 1}</h4>
                        <button
                          type="button"
                          onClick={() => removeEducation(index)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <input
                            type="text"
                            value={education.institution}
                            onChange={(e) => updateEducation(index, 'institution', e.target.value)}
                            placeholder="Instituição"
                            className="w-full p-2 border border-gray-300 rounded focus:border-vibe-blue focus:outline-none"
                          />
                        </div>
                        <div>
                          <input
                            type="text"
                            value={education.degree}
                            onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                            placeholder="Curso/Título"
                            className="w-full p-2 border border-gray-300 rounded focus:border-vibe-blue focus:outline-none"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <input
                            type="text"
                            value={education.field}
                            onChange={(e) => updateEducation(index, 'field', e.target.value)}
                            placeholder="Área de estudo"
                            className="w-full p-2 border border-gray-300 rounded focus:border-vibe-blue focus:outline-none"
                          />
                        </div>
                        <div>
                          <input
                            type="date"
                            value={education.startDate}
                            onChange={(e) => updateEducation(index, 'startDate', e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded focus:border-vibe-blue focus:outline-none"
                          />
                        </div>
                        <div>
                          <input
                            type="date"
                            value={education.endDate}
                            onChange={(e) => updateEducation(index, 'endDate', e.target.value)}
                            disabled={education.isCurrent}
                            className="w-full p-2 border border-gray-300 rounded focus:border-vibe-blue focus:outline-none disabled:bg-gray-100"
                          />
                        </div>
                      </div>

                      <div className="mt-3">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={education.isCurrent}
                            onChange={(e) => {
                              updateEducation(index, 'isCurrent', e.target.checked)
                              if (e.target.checked) {
                                updateEducation(index, 'endDate', '')
                              }
                            }}
                            className="w-4 h-4 text-vibe-blue border-gray-300 rounded focus:ring-vibe-blue"
                          />
                          <span className="text-sm text-gray-700">Cursando atualmente</span>
                        </label>
                      </div>

                      <div className="mt-3">
                        <textarea
                          value={education.description}
                          onChange={(e) => updateEducation(index, 'description', e.target.value)}
                          placeholder="Descrição, especializações, projetos..."
                          rows={2}
                          className="w-full p-2 border border-gray-300 rounded focus:border-vibe-blue focus:outline-none resize-none"
                        />
                      </div>
                    </div>
                  ))}

                  {formData.educationEntries.length === 0 && (
                    <p className="text-center text-gray-500 py-4">
                      Nenhuma formação adicionada. Clique em "Adicionar" para começar.
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin size={16} className="inline mr-1" />
                  Cidade atual
                </label>
                <input
                  type="text"
                  value={formData.currentCity}
                  onChange={(e) => handleInputChange('currentCity', e.target.value)}
                  placeholder="Ex: São Paulo, SP"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:border-vibe-blue focus:outline-none"
                />
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

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
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
