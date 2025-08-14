import React, { useState } from 'react';
import { Heart, MessageCircle, Share2, MoreHorizontal } from 'lucide-react';
import ReactionPicker from './ReactionPicker';
import ShareButton from './ShareButton';
import { api } from '../services/api';

const PostCard = ({ post, currentUser, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [userReaction, setUserReaction] = useState(post.userReaction);
  const [reactionCounts, setReactionCounts] = useState(post.reactionCounts || {});
  const [isShared, setIsShared] = useState(false);
  const [sharesCount, setSharesCount] = useState(post.sharesCount || 0);

  // Calcular total de reações
  const totalReactions = Object.values(reactionCounts).reduce((sum, count) => sum + count, 0);

  // Função para lidar com reações
  const handleReaction = async (reactionType) => {
    if (loading) return;

    setLoading(true);
    
    try {
      if (reactionType === null) {
        // Remover reação
        await api.delete(`/api/reactions/posts/${post.id}/reactions`);
        
        // Atualizar estado local
        if (userReaction) {
          setReactionCounts(prev => ({
            ...prev,
            [userReaction]: Math.max(0, (prev[userReaction] || 0) - 1)
          }));
        }
        setUserReaction(null);
      } else {
        // Adicionar/trocar reação
        await api.post(`/api/reactions/posts/${post.id}/reactions`, {
          reaction_type: reactionType
        });

        // Atualizar estado local
        const newCounts = { ...reactionCounts };
        
        // Se tinha reação anterior, diminuir
        if (userReaction) {
          newCounts[userReaction] = Math.max(0, (newCounts[userReaction] || 0) - 1);
        }
        
        // Aumentar nova reação
        newCounts[reactionType] = (newCounts[reactionType] || 0) + 1;
        
        setReactionCounts(newCounts);
        setUserReaction(reactionType);
      }

      // Notificar componente pai se necessário
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('Erro ao reagir ao post:', error);
    } finally {
      setLoading(false);
    }
  };

  // Função para lidar com compartilhamento
  const handleShare = async (shared, shareText) => {
    try {
      if (shared) {
        setIsShared(true);
        setSharesCount(prev => prev + 1);
      } else {
        setIsShared(false);
        setSharesCount(prev => Math.max(0, prev - 1));
      }

      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('Erro no compartilhamento:', error);
    }
  };

  // Formatação de tempo
  const formatTime = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'agora mesmo';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;
    
    return date.toLocaleDateString('pt-BR');
  };

  // Verificar se é um post compartilhado
  const isSharedPost = post.type === 'shared_post';
  const originalPost = isSharedPost ? post.data.originalPost : post;
  const sharedBy = isSharedPost ? post.data.user : null;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4">
      {/* Header do post compartilhado */}
      {isSharedPost && (
        <div className="px-4 pt-4 pb-2 border-b border-gray-100">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Share2 size={16} />
            <span>
              <strong>{sharedBy.firstName} {sharedBy.lastName}</strong> compartilhou
            </span>
          </div>
          {post.data.shareText && (
            <p className="mt-2 text-gray-800">{post.data.shareText}</p>
          )}
        </div>
      )}

      {/* Header do post original */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center text-white font-semibold">
            {originalPost.author?.firstName?.charAt(0)}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">
              {originalPost.author?.firstName} {originalPost.author?.lastName}
            </h3>
            <p className="text-sm text-gray-500">
              {formatTime(originalPost.createdAt)}
            </p>
          </div>
        </div>
        
        <button className="p-2 hover:bg-gray-100 rounded-lg">
          <MoreHorizontal size={20} className="text-gray-500" />
        </button>
      </div>

      {/* Conteúdo do post */}
      <div className="px-4">
        {originalPost.content && (
          <p className="text-gray-800 mb-4 whitespace-pre-wrap">
            {originalPost.content}
          </p>
        )}

        {/* Imagem */}
        {originalPost.imageUrl && (
          <div className="mb-4">
            <img
              src={originalPost.imageUrl}
              alt="Post"
              className="w-full rounded-lg max-h-96 object-cover"
            />
          </div>
        )}

        {/* Vídeo */}
        {originalPost.videoUrl && (
          <div className="mb-4">
            <video
              src={originalPost.videoUrl}
              controls
              className="w-full rounded-lg max-h-96"
            />
          </div>
        )}
      </div>

      {/* Estatísticas de engajamento */}
      {(totalReactions > 0 || originalPost.commentsCount > 0 || sharesCount > 0) && (
        <div className="px-4 py-2 border-t border-gray-100">
          <div className="flex justify-between text-sm text-gray-600">
            <div className="flex space-x-4">
              {totalReactions > 0 && (
                <span>{totalReactions} reações</span>
              )}
              {originalPost.commentsCount > 0 && (
                <span>{originalPost.commentsCount} comentários</span>
              )}
            </div>
            {sharesCount > 0 && (
              <span>{sharesCount} compartilhamentos</span>
            )}
          </div>
        </div>
      )}

      {/* Botões de ação */}
      <div className="flex items-center justify-around py-3 px-4 border-t border-gray-100">
        {/* Reações */}
        <ReactionPicker
          onReaction={handleReaction}
          currentReaction={userReaction}
          reactionCounts={reactionCounts}
          disabled={loading}
          className="flex-1 justify-center"
        />

        {/* Comentários */}
        <button className="flex items-center space-x-1 text-gray-600 hover:text-blue-600 transition-colors flex-1 justify-center">
          <MessageCircle size={20} />
          <span className="text-sm font-medium">Comentar</span>
        </button>

        {/* Compartilhar */}
        <div className="flex-1 flex justify-center">
          <ShareButton
            post={originalPost}
            onShare={handleShare}
            isShared={isShared}
            sharesCount={sharesCount}
            disabled={loading || originalPost.author?.id === currentUser?.id}
          />
        </div>
      </div>
    </div>
  );
};

export default PostCard;
