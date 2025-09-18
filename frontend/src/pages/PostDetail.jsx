import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { postsAPI } from '../services/api'

const PostDetail = ({ mediaType }) => {
  const { publicId } = useParams()
  const navigate = useNavigate()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await postsAPI.getByPublicId(publicId)
        setPost(res.data)
      } catch (e) {
        setError('Post não encontrado')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [publicId])

  if (loading) return <div className="p-4">Carregando...</div>
  if (error || !post) return <div className="p-4">{error || 'Erro'}</div>

  const isImage = post.type === 'image' || mediaType === 'image'
  const isVideo = post.type === 'video' || mediaType === 'video'

  return (
    <div className="w-full mx-auto max-w-2xl bg-white">
      <div className="p-3 border-b border-gray-100 flex items-center justify-between">
        <div className="font-semibold truncate">Post</div>
        <button onClick={() => navigate(-1)} className="text-vibe-blue">Voltar</button>
      </div>
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
    </div>
  )
}

export default PostDetail
