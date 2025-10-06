import React, { useEffect, useState } from 'react'
import { friendshipsAPI, usersAPI } from '../services/api'
import { useAuth } from '../contexts/AuthContext'

const Suggestions = () => {
  const { user } = useAuth()
  const [received, setReceived] = useState([])
  const [sent, setSent] = useState([])
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const [recRes, sentRes] = await Promise.allSettled([
          friendshipsAPI.getReceivedRequests(),
          friendshipsAPI.getSentRequests()
        ])
        if (!mounted) return
        setReceived(recRes.status === 'fulfilled' ? (recRes.value.data || []) : [])
        setSent(sentRes.status === 'fulfilled' ? (sentRes.value.data || []) : [])

        // Try suggestions endpoint; fallback to local search
        try {
          const sugRes = await usersAPI.searchUsers('')
          setSuggestions(sugRes.data || [])
        } catch (e) {
          // fallback demo suggestions
          const demo = [
            { id: 's1', firstName: 'João', lastName: 'Silva', username: 'joaos' },
            { id: 's2', firstName: 'Maria', lastName: 'Oliveira', username: 'mariao' },
            { id: 's3', firstName: 'Carlos', lastName: 'Pereira', username: 'carlosp' }
          ]
          setSuggestions(demo)
        }
      } catch (err) {
        console.error('Erro ao carregar sugestões/pedidos:', err)
        setError('Não foi possível carregar sugestões')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [user])

  if (loading) return <div className="p-6 text-center text-gray-600">Carregando sugestões e convites...</div>
  if (error) return <div className="p-6 text-red-600">{error}</div>

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h2 className="text-xl font-semibold mb-4">Sugestões</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h3 className="text-lg font-medium mb-2">Convites recebidos</h3>
          {received.length === 0 ? (
            <div className="text-sm text-gray-500">Nenhum convite recebido</div>
          ) : (
            <div className="space-y-2">
              {received.map(r => (
                <div key={r.id || r.user_info?.id} className="p-3 border rounded bg-white flex items-center justify-between">
                  <div>
                    <div className="font-medium">{r.user_info?.firstName} {r.user_info?.lastName}</div>
                    <div className="text-xs text-gray-500">@{r.user_info?.username}</div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="px-3 py-1 bg-vibe-blue text-white rounded">Aceitar</button>
                    <button className="px-3 py-1 border rounded">Recusar</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h3 className="text-lg font-medium mb-2">Convites enviados</h3>
          {sent.length === 0 ? (
            <div className="text-sm text-gray-500">Nenhum convite enviado</div>
          ) : (
            <div className="space-y-2">
              {sent.map(s => (
                <div key={s.id || s.user_info?.id} className="p-3 border rounded bg-white flex items-center justify-between">
                  <div>
                    <div className="font-medium">{s.user_info?.firstName} {s.user_info?.lastName}</div>
                    <div className="text-xs text-gray-500">@{s.user_info?.username}</div>
                  </div>
                  <div>
                    <button className="px-3 py-1 border rounded">Cancelar</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-lg font-medium mb-2">Pessoas que você talvez conheça</h3>
        {suggestions.length === 0 ? (
          <div className="text-sm text-gray-500">Sem sugestões</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {suggestions.map(u => (
              <div key={u.id} className="p-3 border rounded bg-white flex items-center justify-between">
                <div>
                  <div className="font-medium">{u.firstName} {u.lastName}</div>
                  <div className="text-xs text-gray-500">@{u.username}</div>
                </div>
                <div>
                  <button className="px-3 py-1 bg-vibe-blue text-white rounded">Seguir</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Suggestions
