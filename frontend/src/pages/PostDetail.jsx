import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { postsAPI, reactionsAPI } from '../services/api'
import ReactionPicker from '../components/ReactionPicker'

const PostDetail = ({ mediaType }) => {
  const { publicId } = useParams()
  const navigate = useNavigate()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const loadPost = async () => {
    const res = await postsAPI.getByPublicId(publicId)
    setPost(res.data)
  }

  const loadComments = async (pid) => {
    const res = await postsAPI.getComments(pid)
    setComments(res.data.comments || [])
  }

  useEffect(() => {
    const load = async () => {
      try {
        await loadPost()
      } catch (e) {
        setError('Post não encontrado')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [publicId])

  useEffect(() => {
    if (post?.id) {
      loadComments(post.id)
    }
  }, [post?.id])

  if (loading) return <div className="p-4">Carregando...</div>
  if (error || !post) return <div className="p-4">{error || 'Erro'}</div>

  const isImage = post.type === 'image' || mediaType === 'image'
  const isVideo = post.type === 'video' || mediaType === 'video'

  const handleReaction = async (reactionType) => {
    try {
      if (!post?.id) return
      if (reactionType) {
        await reactionsAPI.addPostReaction(post.id, reactionType)
      } else {
        await reactionsAPI.removePostReaction(post.id)
      }
      await loadPost()
    } catch (e) {
      console.error('Erro ao reagir:', e)
    }
  }

  const handleLike = async () => {
    try {
      if (!post?.id) return
      await postsAPI.likePost(post.id)
      await loadPost()
    } catch (e) {
      console.error('Erro ao curtir:', e)
    }
  }

  const handleShare = async () => {
    try {
      if (!post?.id) return
      await postsAPI.sharePost(post.id)
      await loadPost()
    } catch (e) {
      console.error('Erro ao compartilhar:', e)
    }
  }

  const submitComment = async (e) => {
    e.preventDefault()
    if (!newComment.trim() || !post?.id) return
    setSubmitting(true)
    try {
      await postsAPI.createComment(post.id, newComment.trim())
      setNewComment('')
      await loadComments(post.id)
      await loadPost()
    } catch (e) {
      console.error('Erro ao comentar:', e)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="w-full mx-auto max-w-2xl bg-white">
      <div className="p-3 border-b border-gray-100 flex items-center justify-between">
        <div className="font-semibold truncate">Post</div>
        <button onClick={() => navigate(-1)} className="text-vibe-blue">Voltar</button>
      </div>

      {/* Mídia / conteúdo */}
      {isImage && post.imageUrl && (
        <img src={post.imageUrl} alt="Foto" className="w-full object-contain max-h-[80vh] bg-black" />
      )}
      {isVideo && post.videoUrl && (
        <video src={post.videoUrl} controls className="w-full object-contain max-h-[80vh] bg-black" />
      )}
      {!isImage && !isVideo && (
        <div className="p-4">
          <p className="text-gray-800 whitespace-pre-wrap break-words">{post.content}</p>
        </div>
      )}

      {/* Ações */}
      <div className="p-3 border-t border-gray-100 flex items-center justify-between">
        <ReactionPicker
          onReaction={handleReaction}
          currentReaction={post.userReaction}
          likesCount={post.likesCount}
          reactionCounts={post.reactionCounts || {}}
        />
        <div className="flex items-center space-x-4">
          <button onClick={handleLike} className="text-gray-600 hover:text-red-500">Curtir</button>
          <button onClick={handleShare} className="text-gray-600 hover:text-vibe-blue">Compartilhar</button>
        </div>
      </div>

      {/* Comentários */}
      <div className="p-3 border-t border-gray-100">
        <form onSubmit={submitComment} className="flex space-x-2 mb-3">
          <input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Escreva um comentário..."
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
          />
          <button disabled={submitting || !newComment.trim()} className="bg-vibe-blue text-white px-4 rounded-lg disabled:opacity-50">
            Comentar
          </button>
        </form>

        <div className="space-y-3">
          {comments.map((c) => (
            <div key={c.id} className="p-2 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">
                {c.user?.fullName || 'Usuário'} • {new Date(c.createdAt).toLocaleString('pt-BR')}
              </div>
              <div className="text-gray-800">{c.content}</div>
            </div>
          ))}
          {comments.length === 0 && (
            <div className="text-sm text-gray-500">Seja o primeiro a comentar.</div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PostDetail
