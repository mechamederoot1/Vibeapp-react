import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  Shield, 
  Bell, 
  Palette, 
  Lock, 
  AlertTriangle,
  LogOut,
  Eye,
  MessageCircle,
  Globe,
  Save,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const Settings = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('privacy');
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Form states
  const [privacySettings, setPrivacySettings] = useState({});
  const [notificationSettings, setNotificationSettings] = useState({});
  const [appearanceSettings, setAppearanceSettings] = useState({});
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await api.get('/settings/');
      setSettings(response.data);
      setPrivacySettings({
        profileVisibility: response.data.profileVisibility,
        messagePrivacy: response.data.messagePrivacy,
        storyVisibility: response.data.storyVisibility,
        lastSeenPrivacy: response.data.lastSeenPrivacy
      });
      setNotificationSettings({
        emailNotifications: response.data.emailNotifications,
        pushNotifications: response.data.pushNotifications,
        notificationSound: response.data.notificationSound
      });
      setAppearanceSettings({
        theme: response.data.theme,
        language: response.data.language
      });
    } catch (error) {
      console.error('Error loading settings:', error);
      setMessage('Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  const updatePrivacySettings = async () => {
    setSaving(true);
    try {
      await api.put('/settings/privacy', privacySettings);
      setMessage('Configurações de privacidade salvas com sucesso!');
      loadSettings();
    } catch (error) {
      setMessage('Erro ao salvar configurações de privacidade');
    } finally {
      setSaving(false);
    }
  };

  const updateNotificationSettings = async () => {
    setSaving(true);
    try {
      await api.put('/settings/notifications', notificationSettings);
      setMessage('Configurações de notificação salvas com sucesso!');
      loadSettings();
    } catch (error) {
      setMessage('Erro ao salvar configurações de notificação');
    } finally {
      setSaving(false);
    }
  };

  const updateAppearanceSettings = async () => {
    setSaving(true);
    try {
      await api.put('/settings/appearance', appearanceSettings);
      setMessage('Configurações de aparência salvas com sucesso!');
      loadSettings();
      
      // Apply theme immediately
      if (appearanceSettings.theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else if (appearanceSettings.theme === 'light') {
        document.documentElement.classList.remove('dark');
      } else {
        // Auto theme based on system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    } catch (error) {
      setMessage('Erro ao salvar configurações de aparência');
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage('As senhas não coincidem');
      return;
    }
    
    if (passwordForm.newPassword.length < 6) {
      setMessage('A nova senha deve ter pelo menos 6 caracteres');
      return;
    }

    setSaving(true);
    try {
      await api.post('/settings/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      setMessage('Senha alterada com sucesso!');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      setMessage(error.response?.data?.detail || 'Erro ao alterar senha');
    } finally {
      setSaving(false);
    }
  };

  const deactivateAccount = async (duration) => {
    if (!confirm(`Tem certeza que deseja desativar sua conta por ${duration === '1_week' ? '1 semana' : duration === '2_weeks' ? '2 semanas' : '1 mês'}?`)) {
      return;
    }

    setSaving(true);
    try {
      await api.post('/settings/deactivate', {
        duration,
        reason: 'Solicitação do usuário',
        autoReactivation: true
      });
      setMessage('Conta desativada com sucesso. Você será desconectado.');
      setTimeout(() => {
        logout();
      }, 2000);
    } catch (error) {
      setMessage('Erro ao desativar conta');
    } finally {
      setSaving(false);
    }
  };

  const requestDeletion = async () => {
    if (!confirm('ATENÇÃO: Esta ação solicitará a exclusão permanente da sua conta. Você terá 30 dias para cancelar esta solicitação. Deseja continuar?')) {
      return;
    }

    setSaving(true);
    try {
      await api.post('/settings/request-deletion');
      setMessage('Solicitação de exclusão enviada. Você tem 30 dias para cancelar.');
    } catch (error) {
      setMessage('Erro ao solicitar exclusão da conta');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'privacy', label: 'Privacidade', icon: Shield },
    { id: 'notifications', label: 'Notificações', icon: Bell },
    { id: 'appearance', label: 'Aparência', icon: Palette },
    { id: 'security', label: 'Segurança', icon: Lock },
    { id: 'danger', label: 'Zona de Perigo', icon: AlertTriangle }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <SettingsIcon className="h-6 w-6 text-vibe-blue dark:text-white" />
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Configurações</h1>
            </div>
            <button
              onClick={logout}
              className="flex items-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-64">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <nav className="p-4 space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                        activeTab === tab.id
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              {message && (
                <div className="p-4 mb-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-blue-800 dark:text-blue-200">{message}</p>
                </div>
              )}

              {/* Privacy Settings */}
              {activeTab === 'privacy' && (
                <div className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Configurações de Privacidade</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Visibilidade do Perfil
                      </label>
                      <select
                        value={privacySettings.profileVisibility || ''}
                        onChange={(e) => setPrivacySettings({...privacySettings, profileVisibility: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="public">Público</option>
                        <option value="friends">Apenas Amigos</option>
                        <option value="private">Privado</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Quem pode me enviar mensagens
                      </label>
                      <select
                        value={privacySettings.messagePrivacy || ''}
                        onChange={(e) => setPrivacySettings({...privacySettings, messagePrivacy: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="everyone">Todos</option>
                        <option value="friends">Apenas Amigos</option>
                        <option value="nobody">Ninguém</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Quem pode ver meus stories
                      </label>
                      <select
                        value={privacySettings.storyVisibility || ''}
                        onChange={(e) => setPrivacySettings({...privacySettings, storyVisibility: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="everyone">Todos</option>
                        <option value="friends">Amigos</option>
                        <option value="close_friends">Amigos Próximos</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Último acesso visível para
                      </label>
                      <select
                        value={privacySettings.lastSeenPrivacy || ''}
                        onChange={(e) => setPrivacySettings({...privacySettings, lastSeenPrivacy: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="everyone">Todos</option>
                        <option value="friends">Apenas Amigos</option>
                        <option value="nobody">Ninguém</option>
                      </select>
                    </div>

                    <button
                      onClick={updatePrivacySettings}
                      disabled={saving}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      <Save className="h-4 w-4" />
                      <span>{saving ? 'Salvando...' : 'Salvar Configurações'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Notification Settings */}
              {activeTab === 'notifications' && (
                <div className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Configurações de Notificação</h2>
                  
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">Notificações por email</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Receber notificações importantes por email</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notificationSettings.emailNotifications || false}
                          onChange={(e) => setNotificationSettings({...notificationSettings, emailNotifications: e.target.checked})}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">Notificações push</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Receber notificações no dispositivo</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notificationSettings.pushNotifications || false}
                          onChange={(e) => setNotificationSettings({...notificationSettings, pushNotifications: e.target.checked})}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">Som das notificações</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Reproduzir som ao receber notificações</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notificationSettings.notificationSound || false}
                          onChange={(e) => setNotificationSettings({...notificationSettings, notificationSound: e.target.checked})}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <button
                      onClick={updateNotificationSettings}
                      disabled={saving}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      <Save className="h-4 w-4" />
                      <span>{saving ? 'Salvando...' : 'Salvar Configurações'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Appearance Settings */}
              {activeTab === 'appearance' && (
                <div className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Configurações de Aparência</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Tema
                      </label>
                      <select
                        value={appearanceSettings.theme || ''}
                        onChange={(e) => setAppearanceSettings({...appearanceSettings, theme: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="light">Claro</option>
                        <option value="dark">Escuro</option>
                        <option value="auto">Automático</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Idioma
                      </label>
                      <select
                        value={appearanceSettings.language || ''}
                        onChange={(e) => setAppearanceSettings({...appearanceSettings, language: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="pt">Português</option>
                        <option value="en">English</option>
                        <option value="es">Español</option>
                      </select>
                    </div>

                    <button
                      onClick={updateAppearanceSettings}
                      disabled={saving}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      <Save className="h-4 w-4" />
                      <span>{saving ? 'Salvando...' : 'Salvar Configurações'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Security Settings */}
              {activeTab === 'security' && (
                <div className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Configurações de Segurança</h2>
                  
                  <div className="space-y-8">
                    {/* Change Password */}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Alterar Senha</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Senha atual
                          </label>
                          <input
                            type="password"
                            value={passwordForm.currentPassword}
                            onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Nova senha
                          </label>
                          <input
                            type="password"
                            value={passwordForm.newPassword}
                            onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Confirmar nova senha
                          </label>
                          <input
                            type="password"
                            value={passwordForm.confirmPassword}
                            onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        </div>
                        <button
                          onClick={changePassword}
                          disabled={saving || !passwordForm.currentPassword || !passwordForm.newPassword}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                          {saving ? 'Alterando...' : 'Alterar Senha'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Danger Zone */}
              {activeTab === 'danger' && (
                <div className="p-6">
                  <h2 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-6">Zona de Perigo</h2>
                  
                  <div className="space-y-6 border border-red-200 dark:border-red-800 rounded-lg p-4 bg-red-50 dark:bg-red-900/10">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Desativar Conta Temporariamente</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        Desative sua conta por um período específico. Você pode reativar a qualquer momento.
                      </p>
                      <div className="flex flex-wrap gap-3">
                        <button
                          onClick={() => deactivateAccount('1_week')}
                          disabled={saving}
                          className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
                        >
                          1 Semana
                        </button>
                        <button
                          onClick={() => deactivateAccount('2_weeks')}
                          disabled={saving}
                          className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
                        >
                          2 Semanas
                        </button>
                        <button
                          onClick={() => deactivateAccount('1_month')}
                          disabled={saving}
                          className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
                        >
                          1 Mês
                        </button>
                      </div>
                    </div>

                    <div className="border-t border-red-200 dark:border-red-800 pt-6">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Excluir Conta Permanentemente</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        <strong>ATENÇÃO:</strong> Esta ação não pode ser desfeita. Todos os seus dados serão removidos permanentemente após 30 dias.
                      </p>
                      <button
                        onClick={requestDeletion}
                        disabled={saving}
                        className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Solicitar Exclusão</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
