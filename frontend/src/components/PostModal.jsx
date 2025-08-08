import React, { useState } from 'react'
import { X, Image, Video, Type, Send, Palette } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { postsAPI } from '../services/api'

const PostModal = ({ isOpen, onClose, onPost }) => {
  const { user } = useAuth()
  const [postType, setPostType] = useState('text')
  const [content, setContent] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [videoFile, setVideoFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleFileUpload = (file, type) => {
    if (type === 'image') {
      setImageFile(file)
      setVideoFile(null)
      setPostType('image')
    } else if (type === 'video') {
      setVideoFile(file)
      setImageFile(null)
      setPostType('video')
    }
  }

  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result)
      reader.onerror = error => reject(error)
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!content.trim() && !imageFile && !videoFile) {
      setError('Por favor, adicione conteúdo ao seu post')
      return
    }

    setLoading(true)
    setError('')

    try {
      let postData = {
        content: content.trim(),
        type: postType
      }

      // Convert files to base64 for simple upload (in production, use proper file upload service)
      if (imageFile) {
        const imageBase64 = await convertFileToBase64(imageFile)
        postData.imageUrl = imageBase64
        postData.type = 'image'
      }

      if (videoFile) {
        const videoBase64 = await convertFileToBase64(videoFile)
        postData.videoUrl = videoBase64
        postData.type = 'video'
      }

      const response = await postsAPI.createPost(postData)
      
      if (onPost) {
        onPost(response.data)
      }

      // Reset form
      setContent('')
      setImageFile(null)
      setVideoFile(null)
      setPostType('text')
      onClose()

    } catch (error) {
      console.error('Error creating post:', error)
      setError(error.response?.data?.detail || 'Erro ao criar post')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setContent('')
    setImageFile(null)
    setVideoFile(null)
    setPostType('text')
    setError('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Criar post</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* User info */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              {user?.avatar ? (
                <img 
                  src={user.avatar} 
                  alt="Avatar"
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-vibe-blue flex items-center justify-center">
                  <span className="text-white font-bold">
                    {user?.firstName?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
              )}
              <div>
                <p className="font-medium">{user?.fullName || 'Usuário'}</p>
                <p className="text-sm text-gray-500">@{user?.username || user?.email}</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="O que está acontecendo?"
              className="w-full p-3 border border-gray-300 rounded-lg focus:border-vibe-blue focus:outline-none resize-none"
              rows={4}
              maxLength={500}
            />
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-gray-500">
                {content.length}/500 caracteres
              </span>
            </div>

            {/* Media preview */}
            {imageFile && (
              <div className="mt-4 relative">
                <img 
                  src={URL.createObjectURL(imageFile)} 
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => setImageFile(null)}
                  className="absolute top-2 right-2 p-1 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            {videoFile && (
              <div className="mt-4 relative">
                <video 
                  src={URL.createObjectURL(videoFile)} 
                  controls
                  className="w-full h-48 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => setVideoFile(null)}
                  className="absolute top-2 right-2 p-1 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70"
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </div>

          {/* Error message */}
          {error && (
            <div className="mx-4 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between p-4 border-t border-gray-200">
            <div className="flex items-center space-x-2">
              {/* Image upload */}
              <label className="p-2 hover:bg-gray-100 rounded-full cursor-pointer">
                <Image size={20} className="text-gray-500" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files[0] && handleFileUpload(e.target.files[0], 'image')}
                  className="hidden"
                />
              </label>

              {/* Video upload */}
              <label className="p-2 hover:bg-gray-100 rounded-full cursor-pointer">
                <Video size={20} className="text-gray-500" />
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => e.target.files[0] && handleFileUpload(e.target.files[0], 'video')}
                  className="hidden"
                />
              </label>

              {/* Text post */}
              <button
                type="button"
                onClick={() => {
                  setPostType('text')
                  setImageFile(null)
                  setVideoFile(null)
                }}
                className={`p-2 rounded-full ${
                  postType === 'text' ? 'bg-vibe-blue text-white' : 'hover:bg-gray-100 text-gray-500'
                }`}
              >
                <Type size={20} />
              </button>
            </div>

            <button
              type="submit"
              disabled={loading || (!content.trim() && !imageFile && !videoFile)}
              className="flex items-center space-x-2 bg-vibe-blue text-white px-6 py-2 rounded-full hover:bg-vibe-blue-dark disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={16} />
              <span>{loading ? 'Publicando...' : 'Publicar'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default PostModal
