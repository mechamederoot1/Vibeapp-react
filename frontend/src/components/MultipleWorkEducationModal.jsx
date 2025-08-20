import React, { useState, useEffect } from 'react'
import {
  X, Plus, Trash2, Briefcase, GraduationCap, Save, Calendar,
  Building, MapPin, Eye, EyeOff
} from 'lucide-react'

const MultipleWorkEducationModal = ({ 
  isOpen, 
  onClose, 
  personalInfo, 
  onSave,
  loading = false
}) => {
  const [activeTab, setActiveTab] = useState('work')
  const [workExperiences, setWorkExperiences] = useState([])
  const [educationEntries, setEducationEntries] = useState([])
  const [privacySettings, setPrivacySettings] = useState({
    showWorkInfo: true,
    showEducationInfo: true,
    showLocationInfo: true,
    showRelationshipInfo: true,
    showContactInfo: false
  })

  // Initialize form data when modal opens
  useEffect(() => {
    if (isOpen && personalInfo) {
      setWorkExperiences(personalInfo.workExperiences || [])
      setEducationEntries(personalInfo.educationEntries || [])
      if (personalInfo.privacy) {
        setPrivacySettings(personalInfo.privacy)
      }
    }
  }, [isOpen, personalInfo])

  const createEmptyWorkExperience = () => ({
    id: null,
    company: '',
    position: '',
    description: '',
    startDate: '',
    endDate: '',
    isCurrent: false,
    orderIndex: 0
  })

  const createEmptyEducation = () => ({
    id: null,
    institution: '',
    degree: '',
    field: '',
    description: '',
    startDate: '',
    endDate: '',
    isCurrent: false,
    orderIndex: 0
  })

  const addWorkExperience = () => {
    const newWork = createEmptyWorkExperience()
    newWork.orderIndex = workExperiences.length
    setWorkExperiences([...workExperiences, newWork])
  }

  const removeWorkExperience = (index) => {
    setWorkExperiences(workExperiences.filter((_, i) => i !== index))
  }

  const updateWorkExperience = (index, field, value) => {
    const updated = [...workExperiences]
    updated[index] = { ...updated[index], [field]: value }
    setWorkExperiences(updated)
  }

  const addEducation = () => {
    const newEducation = createEmptyEducation()
    newEducation.orderIndex = educationEntries.length
    setEducationEntries([...educationEntries, newEducation])
  }

  const removeEducation = (index) => {
    setEducationEntries(educationEntries.filter((_, i) => i !== index))
  }

  const updateEducation = (index, field, value) => {
    const updated = [...educationEntries]
    updated[index] = { ...updated[index], [field]: value }
    setEducationEntries(updated)
  }

  const handleSave = async () => {
    const data = {
      workExperiences,
      educationEntries,
      privacy: privacySettings
    }
    await onSave(data)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Experiências Profissionais e Formação</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('work')}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === 'work'
                ? 'text-vibe-blue border-b-2 border-vibe-blue bg-blue-50'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Briefcase size={16} className="inline mr-2" />
            Experiência Profissional
          </button>
          <button
            onClick={() => setActiveTab('education')}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === 'education'
                ? 'text-vibe-blue border-b-2 border-vibe-blue bg-blue-50'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <GraduationCap size={16} className="inline mr-2" />
            Formação Acadêmica
          </button>
          <button
            onClick={() => setActiveTab('privacy')}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === 'privacy'
                ? 'text-vibe-blue border-b-2 border-vibe-blue bg-blue-50'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Eye size={16} className="inline mr-2" />
            Privacidade
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Work Experience Tab */}
          {activeTab === 'work' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Suas Experiências Profissionais</h3>
                <button
                  onClick={addWorkExperience}
                  className="flex items-center space-x-2 px-4 py-2 bg-vibe-blue text-white rounded-lg hover:bg-vibe-blue-dark transition-colors"
                >
                  <Plus size={16} />
                  <span>Adicionar</span>
                </button>
              </div>

              {workExperiences.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Briefcase size={32} className="mx-auto mb-3 text-gray-400" />
                  <p className="mb-4">Nenhuma experiência profissional adicionada ainda.</p>
                  <button
                    onClick={addWorkExperience}
                    className="text-vibe-blue hover:text-vibe-blue-dark font-medium"
                  >
                    Adicionar sua primeira experiência
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {workExperiences.map((work, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium text-gray-900">Experiência {index + 1}</h4>
                        <button
                          onClick={() => removeWorkExperience(index)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Empresa *
                          </label>
                          <div className="relative">
                            <Building size={16} className="absolute left-3 top-3 text-gray-400" />
                            <input
                              type="text"
                              value={work.company}
                              onChange={(e) => updateWorkExperience(index, 'company', e.target.value)}
                              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vibe-blue focus:border-vibe-blue"
                              placeholder="Nome da empresa"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Cargo *
                          </label>
                          <input
                            type="text"
                            value={work.position}
                            onChange={(e) => updateWorkExperience(index, 'position', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vibe-blue focus:border-vibe-blue"
                            placeholder="Seu cargo na empresa"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Data de Início
                          </label>
                          <div className="relative">
                            <Calendar size={16} className="absolute left-3 top-3 text-gray-400" />
                            <input
                              type="date"
                              value={work.startDate}
                              onChange={(e) => updateWorkExperience(index, 'startDate', e.target.value)}
                              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vibe-blue focus:border-vibe-blue"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Data de Fim
                          </label>
                          <div className="relative">
                            <Calendar size={16} className="absolute left-3 top-3 text-gray-400" />
                            <input
                              type="date"
                              value={work.endDate}
                              onChange={(e) => updateWorkExperience(index, 'endDate', e.target.value)}
                              disabled={work.isCurrent}
                              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vibe-blue focus:border-vibe-blue disabled:bg-gray-100"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="mt-4">
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
                          <span className="text-sm text-gray-700">Trabalho atualmente nesta empresa</span>
                        </label>
                      </div>

                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Descrição (opcional)
                        </label>
                        <textarea
                          value={work.description}
                          onChange={(e) => updateWorkExperience(index, 'description', e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vibe-blue focus:border-vibe-blue"
                          placeholder="Descreva suas responsabilidades e conquistas..."
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Education Tab */}
          {activeTab === 'education' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Sua Formação Acadêmica</h3>
                <button
                  onClick={addEducation}
                  className="flex items-center space-x-2 px-4 py-2 bg-vibe-blue text-white rounded-lg hover:bg-vibe-blue-dark transition-colors"
                >
                  <Plus size={16} />
                  <span>Adicionar</span>
                </button>
              </div>

              {educationEntries.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <GraduationCap size={32} className="mx-auto mb-3 text-gray-400" />
                  <p className="mb-4">Nenhuma formação acadêmica adicionada ainda.</p>
                  <button
                    onClick={addEducation}
                    className="text-vibe-blue hover:text-vibe-blue-dark font-medium"
                  >
                    Adicionar sua primeira formação
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {educationEntries.map((education, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium text-gray-900">Formação {index + 1}</h4>
                        <button
                          onClick={() => removeEducation(index)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Instituição *
                          </label>
                          <div className="relative">
                            <Building size={16} className="absolute left-3 top-3 text-gray-400" />
                            <input
                              type="text"
                              value={education.institution}
                              onChange={(e) => updateEducation(index, 'institution', e.target.value)}
                              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vibe-blue focus:border-vibe-blue"
                              placeholder="Nome da instituição"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Curso/Título *
                          </label>
                          <input
                            type="text"
                            value={education.degree}
                            onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vibe-blue focus:border-vibe-blue"
                            placeholder="Ex: Bacharelado, Mestrado, Curso Técnico"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Área de Estudo (opcional)
                          </label>
                          <input
                            type="text"
                            value={education.field}
                            onChange={(e) => updateEducation(index, 'field', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vibe-blue focus:border-vibe-blue"
                            placeholder="Ex: Ciência da Computação, Administração, Design"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Data de Início
                          </label>
                          <div className="relative">
                            <Calendar size={16} className="absolute left-3 top-3 text-gray-400" />
                            <input
                              type="date"
                              value={education.startDate}
                              onChange={(e) => updateEducation(index, 'startDate', e.target.value)}
                              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vibe-blue focus:border-vibe-blue"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Data de Conclusão
                          </label>
                          <div className="relative">
                            <Calendar size={16} className="absolute left-3 top-3 text-gray-400" />
                            <input
                              type="date"
                              value={education.endDate}
                              onChange={(e) => updateEducation(index, 'endDate', e.target.value)}
                              disabled={education.isCurrent}
                              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vibe-blue focus:border-vibe-blue disabled:bg-gray-100"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="mt-4">
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
                          <span className="text-sm text-gray-700">Estou estudando atualmente</span>
                        </label>
                      </div>

                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Descrição (opcional)
                        </label>
                        <textarea
                          value={education.description}
                          onChange={(e) => updateEducation(index, 'description', e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vibe-blue focus:border-vibe-blue"
                          placeholder="Descreva projetos importantes, especializações, notas relevantes..."
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Privacy Tab */}
          {activeTab === 'privacy' && (
            <div className="space-y-6">
              <h3 className="font-semibold text-gray-900">Configurações de Privacidade</h3>
              <p className="text-gray-600 text-sm">
                Escolha quais informações pessoais outros usuários podem ver no seu perfil.
              </p>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Briefcase size={20} className="text-gray-500" />
                    <div>
                      <p className="font-medium text-gray-900">Informações de Trabalho</p>
                      <p className="text-sm text-gray-600">Experiências profissionais e cargo atual</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setPrivacySettings(prev => ({ ...prev, showWorkInfo: !prev.showWorkInfo }))}
                    className={`p-2 rounded-full transition-colors ${
                      privacySettings.showWorkInfo 
                        ? 'bg-vibe-blue text-white' 
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {privacySettings.showWorkInfo ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <GraduationCap size={20} className="text-gray-500" />
                    <div>
                      <p className="font-medium text-gray-900">Informações de Educação</p>
                      <p className="text-sm text-gray-600">Formação acadêmica e cursos</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setPrivacySettings(prev => ({ ...prev, showEducationInfo: !prev.showEducationInfo }))}
                    className={`p-2 rounded-full transition-colors ${
                      privacySettings.showEducationInfo 
                        ? 'bg-vibe-blue text-white' 
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {privacySettings.showEducationInfo ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <MapPin size={20} className="text-gray-500" />
                    <div>
                      <p className="font-medium text-gray-900">Informações de Localização</p>
                      <p className="text-sm text-gray-600">Cidade atual e cidade natal</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setPrivacySettings(prev => ({ ...prev, showLocationInfo: !prev.showLocationInfo }))}
                    className={`p-2 rounded-full transition-colors ${
                      privacySettings.showLocationInfo 
                        ? 'bg-vibe-blue text-white' 
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {privacySettings.showLocationInfo ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex items-center space-x-2 px-6 py-2 bg-vibe-blue text-white rounded-lg hover:bg-vibe-blue-dark transition-colors disabled:opacity-50"
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

export default MultipleWorkEducationModal
