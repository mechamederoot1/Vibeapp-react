import React, { useState, useEffect } from 'react'
import {
  X, Heart, MessageCircle, Share, Bookmark, MoreHorizontal,
  Repeat2, Send, ChevronLeft, ChevronRight
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { postsAPI, reactionsAPI } from '../services/api'
import ReactionPicker from './ReactionPicker'

const PostViewModal = ({ isOpen, onClose, post, onPostUpdate }) => {
  const { user } = useAuth()
  const [currentPost, setCurrentPost] = useState(post)
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [showShareMenu, setShowShareMenu] = useState(false)

  useEffect(() => {
    if (isOpen && post) {
      // Load freshest version of the post from backend when possible
      loadFullPost()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, post])

  const loadFullPost = async () => {
    try {
      let full = post
      if (post?.publicId) {
        const res = await postsAPI.getByPublicId(post.publicId)
        full = res.data
      } else if (post?.id) {
        const res = await postsAPI.getPost(post.id)
        full = res.data
      }
      setCurrentPost(full)
      await loadCommentsForPost(full)
    } catch (error) {
      console.error('Error loading post details:', error)
      setCurrentPost(post)
      await loadCommentsForPost(post)
    }
  }

  const loadCommentsForPost = async (p) => {
    if (!p?.id) return
    try {
      const response = await postsAPI.getComments(p.id)
      setComments(response.data.comments || [])
    } catch (error) {
      console.error('Error loading comments:', error)
      setComments([])
    }
  }

  const handleLike = async () => {
    if (!currentPost) return

    try {
      const response = await postsAPI.likePost(currentPost.id)
      const updatedPost = {
        ...currentPost,
        isLiked: response.data.isLiked,
        likesCount: response.data.likesCount
      }
      setCurrentPost(updatedPost)
      onPostUpdate?.(updatedPost)
    } catch (error) {
      console.error('Error liking post:', error)
    }
  }

  const handleReaction = async (reactionType) => {
    if (!currentPost?.id) return
    try {
      if (reactionType) {
        await reactionsAPI.addPostReaction(currentPost.id, reactionType)
      } else {
        await reactionsAPI.removePostReaction(currentPost.id)
      }
      // Reload post to reflect counts and user reaction
      try {
        const res = await postsAPI.getPost(currentPost.id)
        setCurrentPost(res.data)
        onPostUpdate?.(res.data)
      } catch (e) {
        // ignore
      }
    } catch (error) {
      console.error('Error handling reaction:', error)
    }
  }

  const handleShare = async () => {
    if (!currentPost) return
    
    try {
      await postsAPI.sharePost(currentPost.id)
      setShowShareMenu(false)
      // Feedback visual de sucesso
      alert('Post compartilhado!')
    } catch (error) {
      console.error('Error sharing post:', error)
    }
  }

  const handleRepost = async () => {
    if (!currentPost) return
    
    try {
      const response = await postsAPI.repostPost(currentPost.id)
      const updatedPost = {
        ...currentPost,
        repostsCount: response.data.repostsCount
      }
      setCurrentPost(updatedPost)
      onPostUpdate?.(updatedPost)
      setShowShareMenu(false)
    } catch (error) {
      console.error('Error reposting:', error)
    }
  }

  const handleAddComment = async () => {
    if (!newComment.trim() || !currentPost) return
    
    setLoading(true)
    try {
      await postsAPI.createComment(currentPost.id, newComment.trim())
      setNewComment('')
      await loadComments()
      
      // Atualizar contador de comentários
      const updatedPost = {
        ...currentPost,
        commentsCount: (currentPost.commentsCount || 0) + 1
      }
      setCurrentPost(updatedPost)
      onPostUpdate?.(updatedPost)
    } catch (error) {
      console.error('Error adding comment:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleAddComment()
    }
  }

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

  if (!isOpen || !currentPost) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 w-screen h-screen">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X size={24} />
          </button>
          <h2 className="font-semibold">Post</h2>
          <button className="p-2 hover:bg-gray-100 rounded-full">
            <MoreHorizontal size={24} />
          </button>
        </div>
      </div>

      {/* Main Content - Mobile First Layout */}
      <div className="flex flex-col lg:flex-row w-full h-full pt-16">
        {/* Post Content Area */}
        <div className="flex-1 bg-white lg:bg-black flex items-center justify-center p-4 overflow-hidden">
          {currentPost.type === 'text' ? (
            <div className="w-full max-w-2xl">
              {currentPost.backgroundColor ? (
                <div className={`
                  w-full p-8 rounded-2xl flex items-center justify-center min-h-[300px] lg:min-h-[400px]
                  ${currentPost.backgroundColor === 'blue' ? 'bg-gradient-to-br from-blue-400 to-blue-600' :
                    currentPost.backgroundColor === 'green' ? 'bg-gradient-to-br from-green-400 to-green-600' :
                    currentPost.backgroundColor === 'purple' ? 'bg-gradient-to-br from-purple-400 to-purple-600' :
                    currentPost.backgroundColor === 'pink' ? 'bg-gradient-to-br from-pink-400 to-pink-600' :
                    currentPost.backgroundColor === 'orange' ? 'bg-gradient-to-br from-orange-400 to-orange-600' :
                    currentPost.backgroundColor === 'red' ? 'bg-gradient-to-br from-red-400 to-red-600' :
                    currentPost.backgroundColor === 'vibe' ? 'bg-gradient-to-br from-vibe-blue to-vibe-blue-dark' :
                    currentPost.backgroundColor === 'sunset' ? 'bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600' :
                    'bg-gradient-to-br from-vibe-blue to-vibe-blue-dark'}
                `}>
                  <p className="text-xl lg:text-3xl font-medium text-center leading-relaxed break-words text-white">
                    {currentPost.content}
                  </p>
                </div>
              ) : (
                <div className="w-full p-8 bg-gray-50 rounded-2xl flex items-center justify-center min-h-[300px] lg:min-h-[400px]">
                  <p className="text-xl lg:text-3xl font-medium text-center leading-relaxed break-words text-gray-800">
                    {currentPost.content}
                  </p>
                </div>
              )}
            </div>
          ) : currentPost.type === 'image' && currentPost.imageUrl ? (
            <div className="w-full h-full flex items-center justify-center">
              <img
                src={currentPost.imageUrl}
                alt="Post"
                className="max-w-full max-h-full object-contain rounded-lg"
              />
            </div>
          ) : currentPost.type === 'video' && currentPost.videoUrl ? (
            <div className="w-full h-full flex items-center justify-center">
              <video
                src={currentPost.videoUrl}
                controls
                className="max-w-full max-h-full object-contain rounded-lg"
              />
            </div>
          ) : (
            <div className="text-gray-500 text-center">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <MoreHorizontal size={32} />
              </div>
              <p className="text-lg">Conteúdo não disponível</p>
            </div>
          )}
        </div>

        {/* Sidebar - Post Info and Comments */}
        <div className="w-full lg:w-96 bg-white flex flex-col border-t lg:border-t-0 lg:border-l border-gray-200 max-h-[50vh] lg:max-h-full">
          {/* Post Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              {currentPost.author?.avatar ? (
                <img
                  src={currentPost.author.avatar}
                  alt={currentPost.author.fullName}
                  className="w-10 h-10 rounded-full"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-vibe-blue flex items-center justify-center">
                  <span className="text-white font-bold">
                    {currentPost.author?.firstName?.charAt(0)?.toUpperCase() ||
                     currentPost.author?.fullName?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h4 className="font-semibold text-gray-900">
                    {currentPost.author?.fullName || currentPost.author?.firstName || 'Usuário'}
                  </h4>
                  {currentPost.author?.isVerified && (
                    <div className="w-4 h-4 bg-vibe-blue rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                </div>
                <p className="text-gray-500 text-sm">
                  @{currentPost.author?.username || 'usuario'} • {formatDateTime(currentPost.createdAt)}
                </p>
              </div>
            </div>

            {/* Post caption for media posts */}
            {currentPost.content && (currentPost.type === 'image' || currentPost.type === 'video') && (
              <div className="mt-3">
                <p className="text-gray-800 leading-relaxed">{currentPost.content}</p>
              </div>
            )}
          </div>

          {/* Comments Section */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 mb-4">
                Comentários ({currentPost.commentsCount || 0})
              </h3>

              {comments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <MessageCircle size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhum comentário ainda</p>
                  <p className="text-xs">Seja o primeiro a comentar!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex space-x-3">
                      {comment.author?.avatar ? (
                        <img
                          src={comment.author.avatar}
                          alt={comment.author.fullName}
                          className="w-8 h-8 rounded-full flex-shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-xs font-bold">
                            {comment.author?.firstName?.charAt(0)?.toUpperCase() || 'U'}
                          </span>
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium text-sm">
                              {comment.author?.fullName || 'Usuário'}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatDateTime(comment.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-800">{comment.content}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Actions and Comment Input */}
          <div className="border-t border-gray-200">
            {/* Action Buttons */}
            <div className="px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
              <ReactionPicker
                onReaction={handleReaction}
                currentReaction={currentPost.userReaction}
                likesCount={currentPost.likesCount}
                reactionCounts={currentPost.reactionCounts || {}}
              />
              <button className="flex items-center space-x-2 text-gray-500 hover:text-vibe-blue transition-colors">
                <MessageCircle size={20} />
                <span className="text-sm font-medium">{currentPost.commentsCount || 0}</span>
              </button>
              <div className="relative">
                <button
                  onClick={() => setShowShareMenu(!showShareMenu)}
                  className="flex items-center space-x-2 text-gray-500 hover:text-green-500 transition-colors"
                >
                  <Repeat2 size={20} />
                  <span className="text-sm font-medium">{currentPost.repostsCount || 0}</span>
                </button>

                {showShareMenu && (
                  <div className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10">
                    <button
                      onClick={handleRepost}
                      className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                    >
                      Repostar
                    </button>
                    <button
                      onClick={handleShare}
                      className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                    >
                      Compartilhar
                    </button>
                  </div>
                )}
              </div>
            </div>
                <button className="text-gray-500 hover:text-vibe-blue transition-colors">
                  <Bookmark size={20} />
                </button>
              </div>
            </div>

            {/* Comment Input */}
            <div className="p-4 border-t border-gray-100">
              <div className="flex space-x-3">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.fullName}
                    className="w-8 h-8 rounded-full flex-shrink-0"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-vibe-blue flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">
                      {user?.firstName?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                )}
                <div className="flex-1 flex space-x-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Adicione um comentário..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-vibe-blue focus:border-transparent"
                  />
                  <button
                    onClick={handleAddComment}
                    disabled={!newComment.trim() || loading}
                    className="p-2 bg-vibe-blue text-white rounded-full hover:bg-vibe-blue-dark disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PostViewModal
