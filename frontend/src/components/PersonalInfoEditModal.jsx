import React, { useState, useEffect } from 'react'
import { X, Save, Briefcase, GraduationCap, MapPin, Heart, Globe, Phone, Eye, EyeOff, User, Calendar, Plus, Trash2 } from 'lucide-react'

import { workExperienceAPI, personalInfoAPI } from '../services/api'

const PersonalInfoEditModal = ({ isOpen, onClose, personalInfo, onSave }) => {
  const [formData, setFormData] = useState({
    work: {
      company: '',
      position: '',
      description: '',
      startDate: '',
      endDate: '',
      isCurrent: true
    },
    education: {
      institution: '',
      degree: '',
      field: '',
      startDate: '',
      endDate: '',
      isCurrent: false
    },
    location: {
      currentCity: '',
      hometown: '',
      country: ''
    },
    relationship: {
      status: '',
      partnerName: '',
      anniversary: ''
    },
    contact: {
      websitePersonal: '',
      websiteProfessional: '',
      phoneMobile: '',
      phoneWork: ''
    },
    additional: {
      languages: '',
      interests: '',
      aboutMe: ''
    },
    privacy: {
      showWorkInfo: true,
      showEducationInfo: true,
      showLocationInfo: true,
      showRelationshipInfo: true,
      showContactInfo: false
    }
  })

  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('work')
  const [newWorkItems, setNewWorkItems] = useState([])

  // Opções de status de relacionamento
  const relationshipOptions = [
    { value: '', label: 'Não especificado' },
    { value: 'single', label: 'Solteiro(a)' },
    { value: 'in_relationship', label: 'Em um relacionamento' },
    { value: 'married', label: 'Casado(a)' },
    { value: 'complicated', label: 'É complicado' },
    { value: 'divorced', label: 'Divorciado(a)' },
    { value: 'widowed', label: 'Viúvo(a)' }
  ]

  // Carregar dados existentes quando o modal abrir
  useEffect(() => {
    if (isOpen && personalInfo) {
      setFormData({
        work: personalInfo.work || formData.work,
        education: personalInfo.education || formData.education,
        location: personalInfo.location || formData.location,
        relationship: personalInfo.relationship || formData.relationship,
        contact: personalInfo.contact || formData.contact,
        additional: personalInfo.additional || formData.additional,
        privacy: personalInfo.privacy || formData.privacy
      })
      setNewWorkItems([])
    }
  }, [isOpen, personalInfo])

  const handleInputChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }))
  }

  const handlePrivacyChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      privacy: {
        ...prev.privacy,
        [field]: value
      }
    }))
  }

  const handleSave = async () => {
    setLoading(true)
    // Sanitize payload to avoid 422 for date fields
    const sanitizeDate = (val) => (val && typeof val === 'string' ? val : null)
    const payload = {
      ...formData,
      work: formData.work ? {
        ...formData.work,
        startDate: sanitizeDate(formData.work.startDate),
        endDate: formData.work.isCurrent ? null : sanitizeDate(formData.work.endDate)
      } : undefined,
      education: formData.education ? {
        ...formData.education,
        startDate: sanitizeDate(formData.education.startDate),
        endDate: formData.education.isCurrent ? null : sanitizeDate(formData.education.endDate)
      } : undefined,
      relationship: formData.relationship ? {
        ...formData.relationship,
        anniversary: sanitizeDate(formData.relationship.anniversary)
      } : undefined
    }
    try {
      // 1) Criar experiências de trabalho (inclui o cargo principal e os adicionais), evitando duplicados
      const existing = await workExperienceAPI.getAll().then(r => r.data || []).catch(() => [])
      const existingKeys = new Set(existing.map(e => `${(e.position || '').trim().toLowerCase()}::${(e.company || '').trim().toLowerCase()}`))

      const toCreate = []
      const mainCompany = (formData.work?.company || '').trim()
      const mainPosition = (formData.work?.position || '').trim()
      if (mainCompany && mainPosition) {
        const key = `${mainPosition.toLowerCase()}::${mainCompany.toLowerCase()}`
        if (!existingKeys.has(key)) toCreate.push({ company: mainCompany, position: mainPosition })
      }
      const additional = newWorkItems
        .map(i => ({ company: (i.company || '').trim(), position: (i.position || '').trim() }))
        .filter(i => i.company && i.position)
      for (const item of additional) {
        const key = `${item.position.toLowerCase()}::${item.company.toLowerCase()}`
        if (!existingKeys.has(key)) toCreate.push(item)
      }

      let baseOrder = Array.isArray(existing) ? existing.length : 0
      for (const item of toCreate) {
        try {
          await workExperienceAPI.create({
            company: item.company,
            position: item.position,
            description: null,
            start_date: null,
            end_date: null,
            is_current: false,
            order_index: baseOrder++
          })
        } catch (e) {
          console.warn('Falha ao criar experiência de trabalho:', e?.response?.data || e.message)
        }
      }

      // 2) Salvar informações básicas e permitir que o pai recarregue já com as novas experiências
      await onSave(payload)

      // 3) Atualizar dados no modal para refletir criações
      try {
        const refreshed = await personalInfoAPI.get()
        setFormData(prev => ({
          ...prev,
          work: refreshed.data?.personalInfo?.work || prev.work,
          // útil para exibir contadores corretos dentro do modal após salvar
          workExperiences: refreshed.data?.personalInfo?.workExperiences || prev.workExperiences
        }))
      } catch {}

      onClose()
    } catch (error) {
      console.error('Erro ao salvar informações pessoais:', error)
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'work', label: 'Trabalho', icon: Briefcase },
    { id: 'education', label: 'Formação', icon: GraduationCap },
    { id: 'location', label: 'Localização', icon: MapPin },
    { id: 'relationship', label: 'Relacionamento', icon: Heart },
    { id: 'contact', label: 'Contato', icon: Globe },
    { id: 'additional', label: 'Outros', icon: User },
    { id: 'privacy', label: 'Privacidade', icon: Eye }
  ]

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
      <div className="bg-white h-full w-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-900">Editar informações pessoais</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto border-b border-gray-200 px-6 scrollbar-hide flex-shrink-0">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-3 whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-vibe-blue text-vibe-blue'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon size={16} />
                <span className="text-sm font-medium">{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* Tab: Trabalho */}
          {activeTab === 'work' && (
            <div className="space-y-4">
              {/* Posição/Empresa atual */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cargo / Posição
                </label>
                <input
                  type="text"
                  value={formData.work.position}
                  onChange={(e) => handleInputChange('work', 'position', e.target.value)}
                  placeholder="Ex: UX Designer"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vibe-blue focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Empresa / Organização
                </label>
                <input
                  type="text"
                  value={formData.work.company}
                  onChange={(e) => handleInputChange('work', 'company', e.target.value)}
                  placeholder="Ex: TechCorp"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vibe-blue focus:border-transparent"
                />
              </div>

              {/* Adicionar múltiplos cargos */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-gray-800">Experiências adicionais</h4>
                  <button
                    onClick={() => setNewWorkItems(prev => [...prev, { position: '', company: '' }])}
                    className="btn-secondary flex items-center space-x-2 px-3 py-1.5"
                    type="button"
                  >
                    <Plus size={16} />
                    <span>Adicionar cargo</span>
                  </button>
                </div>
                <div className="space-y-3">
                  {newWorkItems.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-1 md:grid-cols-7 gap-2">
                      <div className="md:col-span-3">
                        <input
                          type="text"
                          value={item.position}
                          onChange={(e) => {
                            const val = e.target.value
                            setNewWorkItems(list => list.map((w,i) => i===idx ? {...w, position: val} : w))
                          }}
                          placeholder="Cargo / Posição"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vibe-blue focus:border-transparent"
                        />
                      </div>
                      <div className="md:col-span-3">
                        <input
                          type="text"
                          value={item.company}
                          onChange={(e) => {
                            const val = e.target.value
                            setNewWorkItems(list => list.map((w,i) => i===idx ? {...w, company: val} : w))
                          }}
                          placeholder="Empresa / Organização"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vibe-blue focus:border-transparent"
                        />
                      </div>
                      <div className="md:col-span-1 flex items-center justify-end">
                        <button
                          onClick={() => setNewWorkItems(list => list.filter((_,i) => i!==idx))}
                          className="p-2 hover:bg-gray-100 rounded-lg"
                          type="button"
                          title="Remover"
                        >
                          <Trash2 size={16} className="text-gray-500" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição
                </label>
                <textarea
                  value={formData.work.description}
                  onChange={(e) => handleInputChange('work', 'description', e.target.value)}
                  placeholder="Descreva suas responsabilidades e atividades..."
                  rows={3}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vibe-blue focus:border-transparent resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data de Início
                  </label>
                  <input
                    type="date"
                    value={formData.work.startDate}
                    onChange={(e) => handleInputChange('work', 'startDate', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vibe-blue focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data de Término
                  </label>
                  <input
                    type="date"
                    value={formData.work.endDate}
                    onChange={(e) => handleInputChange('work', 'endDate', e.target.value)}
                    disabled={formData.work.isCurrent}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vibe-blue focus:border-transparent disabled:bg-gray-100"
                  />
                </div>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="workCurrent"
                  checked={formData.work.isCurrent}
                  onChange={(e) => handleInputChange('work', 'isCurrent', e.target.checked)}
                  className="h-4 w-4 text-vibe-blue border-gray-300 rounded focus:ring-vibe-blue"
                />
                <label htmlFor="workCurrent" className="ml-2 text-sm text-gray-700">
                  Trabalho atual
                </label>
              </div>
            </div>
          )}

          {/* Tab: Educação */}
          {activeTab === 'education' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Curso / Grau
                </label>
                <input
                  type="text"
                  value={formData.education.degree}
                  onChange={(e) => handleInputChange('education', 'degree', e.target.value)}
                  placeholder="Ex: Design Digital"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vibe-blue focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Instituição
                </label>
                <input
                  type="text"
                  value={formData.education.institution}
                  onChange={(e) => handleInputChange('education', 'institution', e.target.value)}
                  placeholder="Ex: UFPE"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vibe-blue focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Área de Estudo
                </label>
                <input
                  type="text"
                  value={formData.education.field}
                  onChange={(e) => handleInputChange('education', 'field', e.target.value)}
                  placeholder="Ex: Design, Tecnologia, Artes..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vibe-blue focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data de Início
                  </label>
                  <input
                    type="date"
                    value={formData.education.startDate}
                    onChange={(e) => handleInputChange('education', 'startDate', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vibe-blue focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data de Conclusão
                  </label>
                  <input
                    type="date"
                    value={formData.education.endDate}
                    onChange={(e) => handleInputChange('education', 'endDate', e.target.value)}
                    disabled={formData.education.isCurrent}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vibe-blue focus:border-transparent disabled:bg-gray-100"
                  />
                </div>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="educationCurrent"
                  checked={formData.education.isCurrent}
                  onChange={(e) => handleInputChange('education', 'isCurrent', e.target.checked)}
                  className="h-4 w-4 text-vibe-blue border-gray-300 rounded focus:ring-vibe-blue"
                />
                <label htmlFor="educationCurrent" className="ml-2 text-sm text-gray-700">
                  Estudando atualmente
                </label>
              </div>
            </div>
          )}

          {/* Tab: Localização */}
          {activeTab === 'location' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cidade Atual
                </label>
                <input
                  type="text"
                  value={formData.location.currentCity}
                  onChange={(e) => handleInputChange('location', 'currentCity', e.target.value)}
                  placeholder="Ex: Recife, PE"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vibe-blue focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cidade Natal
                </label>
                <input
                  type="text"
                  value={formData.location.hometown}
                  onChange={(e) => handleInputChange('location', 'hometown', e.target.value)}
                  placeholder="Ex: São Paulo, SP"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vibe-blue focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  País
                </label>
                <input
                  type="text"
                  value={formData.location.country}
                  onChange={(e) => handleInputChange('location', 'country', e.target.value)}
                  placeholder="Ex: Brasil"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vibe-blue focus:border-transparent"
                />
              </div>
            </div>
          )}

          {/* Tab: Relacionamento */}
          {activeTab === 'relationship' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status do Relacionamento
                </label>
                <select
                  value={formData.relationship.status}
                  onChange={(e) => handleInputChange('relationship', 'status', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vibe-blue focus:border-transparent"
                >
                  {relationshipOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              {(formData.relationship.status === 'in_relationship' || formData.relationship.status === 'married') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome do Parceiro(a)
                  </label>
                  <input
                    type="text"
                    value={formData.relationship.partnerName}
                    onChange={(e) => handleInputChange('relationship', 'partnerName', e.target.value)}
                    placeholder="Ex: João Silva"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vibe-blue focus:border-transparent"
                  />
                </div>
              )}
              {formData.relationship.status === 'married' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data do Casamento
                  </label>
                  <input
                    type="date"
                    value={formData.relationship.anniversary}
                    onChange={(e) => handleInputChange('relationship', 'anniversary', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vibe-blue focus:border-transparent"
                  />
                </div>
              )}
              {formData.relationship.status === 'in_relationship' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Aniversário do Relacionamento
                  </label>
                  <input
                    type="date"
                    value={formData.relationship.anniversary}
                    onChange={(e) => handleInputChange('relationship', 'anniversary', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vibe-blue focus:border-transparent"
                  />
                </div>
              )}
            </div>
          )}

          {/* Tab: Contato */}
          {activeTab === 'contact' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Site Pessoal
                </label>
                <input
                  type="url"
                  value={formData.contact.websitePersonal}
                  onChange={(e) => handleInputChange('contact', 'websitePersonal', e.target.value)}
                  placeholder="Ex: https://meusite.com"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vibe-blue focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Site Profissional
                </label>
                <input
                  type="url"
                  value={formData.contact.websiteProfessional}
                  onChange={(e) => handleInputChange('contact', 'websiteProfessional', e.target.value)}
                  placeholder="Ex: https://portfolio.com"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vibe-blue focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telefone Celular
                </label>
                <input
                  type="tel"
                  value={formData.contact.phoneMobile}
                  onChange={(e) => handleInputChange('contact', 'phoneMobile', e.target.value)}
                  placeholder="Ex: (11) 99999-9999"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vibe-blue focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telefone Trabalho
                </label>
                <input
                  type="tel"
                  value={formData.contact.phoneWork}
                  onChange={(e) => handleInputChange('contact', 'phoneWork', e.target.value)}
                  placeholder="Ex: (11) 3333-3333"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vibe-blue focus:border-transparent"
                />
              </div>
            </div>
          )}

          {/* Tab: Outros */}
          {activeTab === 'additional' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Idiomas
                </label>
                <input
                  type="text"
                  value={formData.additional.languages}
                  onChange={(e) => handleInputChange('additional', 'languages', e.target.value)}
                  placeholder="Ex: Português, Inglês, Espanhol"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vibe-blue focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Interesses
                </label>
                <input
                  type="text"
                  value={formData.additional.interests}
                  onChange={(e) => handleInputChange('additional', 'interests', e.target.value)}
                  placeholder="Ex: Design, Tecnologia, Fotografia, Viagens"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vibe-blue focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sobre Mim
                </label>
                <textarea
                  value={formData.additional.aboutMe}
                  onChange={(e) => handleInputChange('additional', 'aboutMe', e.target.value)}
                  placeholder="Conte um pouco mais sobre você..."
                  rows={4}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vibe-blue focus:border-transparent resize-none"
                />
              </div>
            </div>
          )}

          {/* Tab: Privacidade */}
          {activeTab === 'privacy' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 mb-4">
                Escolha quais informações pessoais você deseja exibir para outros usuários:
              </p>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Briefcase size={16} className="text-gray-500" />
                    <span className="text-sm font-medium">Informações de trabalho</span>
                  </div>
                  <button
                    onClick={() => handlePrivacyChange('showWorkInfo', !formData.privacy.showWorkInfo)}
                    className={`p-1 rounded ${formData.privacy.showWorkInfo ? 'text-green-600' : 'text-gray-400'}`}
                  >
                    {formData.privacy.showWorkInfo ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <GraduationCap size={16} className="text-gray-500" />
                    <span className="text-sm font-medium">Informações de educação</span>
                  </div>
                  <button
                    onClick={() => handlePrivacyChange('showEducationInfo', !formData.privacy.showEducationInfo)}
                    className={`p-1 rounded ${formData.privacy.showEducationInfo ? 'text-green-600' : 'text-gray-400'}`}
                  >
                    {formData.privacy.showEducationInfo ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <MapPin size={16} className="text-gray-500" />
                    <span className="text-sm font-medium">Informações de localização</span>
                  </div>
                  <button
                    onClick={() => handlePrivacyChange('showLocationInfo', !formData.privacy.showLocationInfo)}
                    className={`p-1 rounded ${formData.privacy.showLocationInfo ? 'text-green-600' : 'text-gray-400'}`}
                  >
                    {formData.privacy.showLocationInfo ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Heart size={16} className="text-gray-500" />
                    <span className="text-sm font-medium">Informações de relacionamento</span>
                  </div>
                  <button
                    onClick={() => handlePrivacyChange('showRelationshipInfo', !formData.privacy.showRelationshipInfo)}
                    className={`p-1 rounded ${formData.privacy.showRelationshipInfo ? 'text-green-600' : 'text-gray-400'}`}
                  >
                    {formData.privacy.showRelationshipInfo ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Phone size={16} className="text-gray-500" />
                    <span className="text-sm font-medium">Informações de contato</span>
                  </div>
                  <button
                    onClick={() => handlePrivacyChange('showContactInfo', !formData.privacy.showContactInfo)}
                    className={`p-1 rounded ${formData.privacy.showContactInfo ? 'text-green-600' : 'text-gray-400'}`}
                  >
                    {formData.privacy.showContactInfo ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="btn-primary flex items-center space-x-2 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save size={16} />
            )}
            <span>{loading ? 'Salvando...' : 'Salvar'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default PersonalInfoEditModal
