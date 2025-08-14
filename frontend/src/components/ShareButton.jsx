import React, { useState } from 'react';
import { Share2, Check } from 'lucide-react';
import { api } from '../services/api';

const ShareButton = ({ 
  post, 
  onShare, 
  className = "",
  disabled = false,
  isShared = false,
  sharesCount = 0
}) => {
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [shareText, setShareText] = useState('');

  const handleShare = async () => {
    if (disabled || loading) return;

    if (isShared) {
      // Se já compartilhou, remover compartilhamento
      try {
        setLoading(true);
        await api.delete(`/api/shares/posts/${post.id}/share`);
        
        if (onShare) {
          onShare(false);
        }
      } catch (error) {
        console.error('Erro ao remover compartilhamento:', error);
      } finally {
        setLoading(false);
      }
    } else {
      // Mostrar modal para adicionar texto opcional
      setShowModal(true);
    }
  };

  const confirmShare = async () => {
    try {
      setLoading(true);
      await api.post(`/api/shares/posts/${post.id}/share`, {
        shareText: shareText.trim() || null
      });

      if (onShare) {
        onShare(true, shareText.trim() || null);
      }

      setShowModal(false);
      setShareText('');
    } catch (error) {
      console.error('Erro ao compartilhar post:', error);
      alert('Erro ao compartilhar post. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const cancelShare = () => {
    setShowModal(false);
    setShareText('');
  };

  return (
    <>
      <button
        onClick={handleShare}
        disabled={disabled || loading}
        className={`
          flex items-center space-x-1 transition-all duration-200
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105'}
          ${isShared 
            ? 'text-green-600 hover:text-green-700' 
            : 'text-gray-600 hover:text-green-600'
          }
          ${loading ? 'animate-pulse' : ''}
          ${className}
        `}
      >
        {isShared ? (
          <Check size={20} className="fill-current" />
        ) : (
          <Share2 size={20} />
        )}
        
        {sharesCount > 0 && (
          <span className="text-sm font-medium">
            {sharesCount}
          </span>
        )}
      </button>

      {/* Modal de Compartilhamento */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Compartilhar Post
              </h3>

              {/* Preview do Post */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                    {post.author?.firstName?.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-900">
                      {post.author?.firstName} {post.author?.lastName}
                    </p>
                    <p className="text-xs text-gray-600">
                      {new Date(post.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>

                {post.content && (
                  <p className="text-gray-800 text-sm mb-3 line-clamp-3">
                    {post.content}
                  </p>
                )}

                {post.imageUrl && (
                  <img
                    src={post.imageUrl}
                    alt="Post"
                    className="w-full h-32 object-cover rounded-lg"
                  />
                )}
              </div>

              {/* Campo de Texto Opcional */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adicione um comentário (opcional)
                </label>
                <textarea
                  value={shareText}
                  onChange={(e) => setShareText(e.target.value)}
                  placeholder="Diga algo sobre este post..."
                  rows={3}
                  maxLength={280}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                />
                <div className="text-right text-xs text-gray-500 mt-1">
                  {shareText.length}/280
                </div>
              </div>

              {/* Botões */}
              <div className="flex space-x-3">
                <button
                  onClick={cancelShare}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmShare}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Compartilhando...' : 'Compartilhar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ShareButton;
