import React, { useEffect, useState } from 'react'
import { testimonialsAPI } from '../services/api'
import { Heart, MessageCircle } from 'lucide-react'

const TestimonialCard = ({ t }) => {
  const author = t.author || t.from || {}
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-start space-x-3">
        <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden flex-shrink-0">
          {author.avatar ? (
            <img src={author.avatar} alt={author.firstName || author.username} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">{(author.firstName||'U').charAt(0)}</div>
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-sm">{author.firstName ? `${author.firstName} ${author.lastName||''}` : (author.username || 'Usuário')}</div>
              {t.title && <div className="text-xs text-gray-500">{t.title}</div>}
            </div>
            <div className="text-sm text-gray-400">{new Date(t.createdAt || t.created_at || Date.now()).toLocaleDateString()}</div>
          </div>
          <div className="mt-2 text-gray-700 text-sm whitespace-pre-line">{t.content || t.body || t.text}</div>
          <div className="mt-3 flex items-center space-x-3 text-sm text-gray-500">
            <div className="flex items-center space-x-1">
              <Heart size={14} />
              <span>{t.likesCount || 0}</span>
            </div>
            <div className="flex items-center space-x-1">
              <MessageCircle size={14} />
              <span>{t.commentsCount || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const TestimonialsList = ({ targetUserId }) => {
  const [testimonials, setTestimonials] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!targetUserId) return
    let mounted = true
    setLoading(true)
    setError(null)
    testimonialsAPI.getForUser(targetUserId)
      .then(res => {
        if (!mounted) return
        const list = res.data?.testimonials || res.data || []
        setTestimonials(list)
      })
      .catch(err => {
        if (!mounted) return
        console.error('Erro ao carregar depoimentos:', err)
        setError('Não foi possível carregar depoimentos')
      })
      .finally(() => { if (mounted) setLoading(false) })

    return () => { mounted = false }
  }, [targetUserId])

  if (!targetUserId) return <div className="text-sm text-gray-500">Usuário desconhecido</div>
  if (loading) return <div className="text-center py-6 text-gray-600">Carregando depoimentos...</div>
  if (error) return <div className="text-red-600 p-3 bg-red-50 rounded">{error}</div>
  if (!testimonials || testimonials.length === 0) return <div className="text-gray-500">Nenhum depoimento recebido ainda.</div>

  return (
    <div className="space-y-3">
      {testimonials.map(t => <TestimonialCard key={t.id || `${t.createdAt}` } t={t} />)}
    </div>
  )
}

export default TestimonialsList
