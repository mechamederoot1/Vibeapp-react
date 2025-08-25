import React, { useState, useEffect } from 'react'
import { Search as SearchIcon, UserPlus, Users, X } from 'lucide-react'
import { usersAPI } from '../services/api'

const Search = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [recentSearches, setRecentSearches] = useState([])

  // Carregar pesquisas recentes do localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches')
    if (saved) {
      setRecentSearches(JSON.parse(saved))
    }
  }, [])

  // Função de pesquisa
  const handleSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    setLoading(true)
    try {
      const response = await usersAPI.searchUsers(query)
      setSearchResults(response.data || [])
    } catch (error) {
      console.error('Erro ao pesquisar usuários:', error)
      setSearchResults([])
    } finally {
      setLoading(false)
    }
  }

  // Debounce da pesquisa
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      handleSearch(searchQuery)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  // Adicionar à pesquisas recentes
  const addToRecentSearches = (user) => {
    const newRecent = [user, ...recentSearches.filter(r => r.id !== user.id)].slice(0, 5)
    setRecentSearches(newRecent)
    localStorage.setItem('recentSearches', JSON.stringify(newRecent))
  }

  // Limpar pesquisas recentes
  const clearRecentSearches = () => {
    setRecentSearches([])
    localStorage.removeItem('recentSearches')
  }

  const UserCard = ({ user, isRecent = false }) => (
    <div className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-center space-x-3">
        {user.avatar ? (
          <img
            src={user.avatar}
            alt={user.name}
            className="w-12 h-12 rounded-full object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-vibe-blue to-vibe-blue-dark flex items-center justify-center">
            <span className="text-white font-bold text-lg">
              {user.name?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          </div>
        )}
        <div>
          <h3 className="font-semibold text-gray-900">{user.name || 'Usuário'}</h3>
          <p className="text-gray-600 text-sm">@{user.username || 'usuario'}</p>
          {user.mutualFriends && (
            <p className="text-gray-500 text-xs">{user.mutualFriends} amigos em comum</p>
          )}
        </div>
      </div>
      <button
        onClick={() => !isRecent && addToRecentSearches(user)}
        className="btn-primary"
      >
        <UserPlus size={16} className="mr-1" />
        Seguir
      </button>
    </div>
  )

  return (
    <div className="bg-white min-h-screen">
      {/* Header com busca */}
      <div className="sticky top-0 bg-white border-b border-gray-200 z-10">
        <div className="p-4">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Pesquisar pessoas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vibe-blue focus:border-transparent"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="pb-20">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-vibe-blue"></div>
          </div>
        ) : searchQuery ? (
          // Resultados da pesquisa
          <div>
            {searchResults.length > 0 ? (
              <div>
                <h2 className="text-lg font-semibold p-4 pb-2">Resultados</h2>
                {searchResults.map((user) => (
                  <UserCard key={user.id} user={user} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <SearchIcon className="mx-auto mb-4 text-gray-300" size={48} />
                <h3 className="text-lg font-medium text-gray-600 mb-2">Nenhum resultado encontrado</h3>
                <p className="text-gray-500">Tente pesquisar com termos diferentes</p>
              </div>
            )}
          </div>
        ) : (
          // Estado inicial
          <div>
            {/* Pesquisas recentes */}
            {recentSearches.length > 0 && (
              <div className="border-b border-gray-200">
                <div className="flex items-center justify-between p-4 pb-2">
                  <h2 className="text-lg font-semibold">Recentes</h2>
                  <button
                    onClick={clearRecentSearches}
                    className="text-sm text-vibe-blue hover:text-vibe-blue-dark"
                  >
                    Limpar tudo
                  </button>
                </div>
                {recentSearches.map((user) => (
                  <UserCard key={user.id} user={user} isRecent />
                ))}
              </div>
            )}

            {/* Estado vazio */}
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="text-gray-400" size={32} />
              </div>
              <h3 className="text-lg font-medium text-gray-600 mb-2">Encontre amigos</h3>
              <p className="text-gray-500 px-8">
                Pesquise por nome ou nome de usuário para encontrar pessoas e fazer novas conexões
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Search
