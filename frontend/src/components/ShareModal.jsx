import React, { useState } from 'react'
import { X, Share, MessageCircle, Users, Globe, Lock } from 'lucide-react'

const ShareModal = ({ 
  isOpen, 
  onClose, 
  post, 
  onShare, 
  currentUser 
}) => {
  const [shareComment, setShareComment] = useState('')
  const [shareType, setShareType] = useState('public') // public, friends, private
  const [isSharing, setIsSharing] = useState(false)

  if (!isOpen || !post) return null

  const formatDateTime = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleShare = async () => {
    if (isSharing) return

    setIsSharing(true)
    try {
      await onShare({
        postId: post.id,
        comment: shareComment.trim(),
        shareType: shareType
      })
      
      // Limpar formulário e fechar modal
      setShareComment('')
      setShareType('public')
      onClose()
    } catch (error) {
      console.error('Error sharing post:', error)
    } finally {
      setIsSharing(false)
    }
  }

  const shareOptions = [
    { 
      value: 'public', 
      label: 'Público', 
      icon: Globe, 
      description: 'Todos podem ver este compartilhamento' 
    },
    { 
      value: 'friends', 
      label: 'Amigos', 
      icon: Users, 
      description: 'Apenas seus amigos podem ver' 
    },
    { 
      value: 'private', 
      label: 'Só eu', 
      icon: Lock, 
      description: 'Apenas você pode ver este compartilhamento' 
    }
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <Share size={20} />
            <span>Compartilhar Post</span>
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Área de comentário */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex space-x-3">
              {/* Avatar do usuário atual */}
              <img
                src={currentUser?.avatar || `https://ui-avatars.com/api/?name=${currentUser?.first_name}+${currentUser?.last_name}&background=87ceeb&color=fff`}
                alt={currentUser?.first_name}
                className="w-10 h-10 rounded-full object-cover"
              />
              
              <div className="flex-1">
                {/* Nome do usuário */}
                <div className="font-medium text-gray-900 mb-2">
                  {currentUser?.first_name} {currentUser?.last_name}
                </div>
                
                {/* Textarea para comentário */}
                <textarea
                  value={shareComment}
                  onChange={(e) => setShareComment(e.target.value)}
                  placeholder="Adicione um comentário ao compartilhar..."
                  className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-vibe-blue focus:border-transparent"
                  rows={3}
                  maxLength={500}
                />
                
                {/* Contador de caracteres */}
                <div className="text-right text-sm text-gray-500 mt-1">
                  {shareComment.length}/500
                </div>
              </div>
            </div>
          </div>

          {/* Opções de privacidade */}
          <div className="p-4 border-b border-gray-100">
            <h4 className="font-medium text-gray-900 mb-3">Quem pode ver este compartilhamento?</h4>
            <div className="space-y-2">
              {shareOptions.map((option) => {
                const IconComponent = option.icon
                return (
                  <label
                    key={option.value}
                    className={`
                      flex items-center space-x-3 p-3 rounded-lg border cursor-pointer
                      transition-colors duration-200
                      ${shareType === option.value 
                        ? 'border-vibe-blue bg-blue-50' 
                        : 'border-gray-200 hover:bg-gray-50'
                      }
                    `}
                  >
                    <input
                      type="radio"
                      name="shareType"
                      value={option.value}
                      checked={shareType === option.value}
                      onChange={(e) => setShareType(e.target.value)}
                      className="sr-only"
                    />
                    <IconComponent 
                      size={20} 
                      className={shareType === option.value ? 'text-vibe-blue' : 'text-gray-600'} 
                    />
                    <div className="flex-1">
                      <div className={`font-medium ${shareType === option.value ? 'text-vibe-blue' : 'text-gray-900'}`}>
                        {option.label}
                      </div>
                      <div className="text-sm text-gray-500">
                        {option.description}
                      </div>
                    </div>
                    <div className={`w-4 h-4 rounded-full border-2 ${
                      shareType === option.value 
                        ? 'border-vibe-blue bg-vibe-blue' 
                        : 'border-gray-300'
                    }`}>
                      {shareType === option.value && (
                        <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                      )}
                    </div>
                  </label>
                )
              })}
            </div>
          </div>

          {/* Preview do post sendo compartilhado */}
          <div className="p-4">
            <h4 className="font-medium text-gray-900 mb-3">Post que você está compartilhando:</h4>
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              {/* Autor do post original */}
              <div className="flex items-center space-x-3 mb-3">
                <img
                  src={post.author?.avatar_url || `https://ui-avatars.com/api/?name=${post.author?.firstName}+${post.author?.lastName}&background=87ceeb&color=fff`}
                  alt={post.author?.firstName}
                  className="w-8 h-8 rounded-full object-cover"
                />
                <div>
                  <div className="font-medium text-gray-900 text-sm">
                    {post.author?.firstName} {post.author?.lastName}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatDateTime(post.createdAt)}
                  </div>
                </div>
              </div>

              {/* Conteúdo do post */}
              {post.content && (
                <div className="text-gray-800 mb-3 text-sm">
                  {post.content}
                </div>
              )}

              {/* Imagem do post */}
              {post.imageUrl && (
                <div className="rounded-lg overflow-hidden mb-3">
                  <img
                    src={post.imageUrl}
                    alt="Post content"
                    className="w-full h-32 object-cover"
                  />
                </div>
              )}

              {/* Estatísticas do post */}
              <div className="flex items-center space-x-4 text-xs text-gray-500">
                {post.likesCount > 0 && (
                  <span>{post.likesCount} curtidas</span>
                )}
                {post.commentsCount > 0 && (
                  <span>{post.commentsCount} comentários</span>
                )}
                {post.sharesCount > 0 && (
                  <span>{post.sharesCount} compartilhamentos</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            disabled={isSharing}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleShare}
            disabled={isSharing}
            className="px-6 py-2 bg-vibe-blue text-white rounded-lg hover:bg-vibe-blue-dark 
                     transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                     flex items-center space-x-2"
          >
            {isSharing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Compartilhando...</span>
              </>
            ) : (
              <>
                <Share size={16} />
                <span>Compartilhar</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ShareModal
