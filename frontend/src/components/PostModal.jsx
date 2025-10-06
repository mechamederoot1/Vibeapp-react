import React, { useState, useEffect, useRef } from 'react'
import { X, Image, Video, Type, Send, Palette, Mic, BarChart3, Calendar, MapPin, Users, Smile, Plus, Globe, ChevronDown } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { postsAPI, testimonialsAPI, usersAPI } from '../services/api'

const PostModal = ({ isOpen, onClose, onPost }) => {
  const { user } = useAuth()
  const [postType, setPostType] = useState('text')
  const [content, setContent] = useState('')
  // Testimonial-specific state
  const [testimonialTitle, setTestimonialTitle] = useState('')
  const [testimonialRecipientQuery, setTestimonialRecipientQuery] = useState('')
  const [testimonialRecipient, setTestimonialRecipient] = useState(null)
  const [testimonialContentHtml, setTestimonialContentHtml] = useState('')
  const [testimonialFont, setTestimonialFont] = useState('Montserrat')
  const [testimonialBgColor, setTestimonialBgColor] = useState(null)
  const [testimonialTextColor, setTestimonialTextColor] = useState('#000000')
  const [testimonialSearchResults, setTestimonialSearchResults] = useState([])
  const testimonialEditorRef = useRef(null)

  // Shadow controls
  const [testimonialShadowEnabled, setTestimonialShadowEnabled] = useState(false)
  const [testimonialShadowColor, setTestimonialShadowColor] = useState('#000000')
  const [testimonialShadowOffset, setTestimonialShadowOffset] = useState(2)
  const [testimonialShadowBlur, setTestimonialShadowBlur] = useState(4)

  useEffect(() => {
    if (testimonialEditorRef.current && testimonialEditorRef.current.innerHTML !== testimonialContentHtml) {
      testimonialEditorRef.current.innerHTML = testimonialContentHtml
    }
  }, [testimonialContentHtml])
  const [imageFile, setImageFile] = useState(null)
  const [videoFile, setVideoFile] = useState(null)
  const [audioFile, setAudioFile] = useState(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null)
  const [videoPreviewUrl, setVideoPreviewUrl] = useState(null)
  const [audioPreviewUrl, setAudioPreviewUrl] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showOptions, setShowOptions] = useState(false)
  const [showMediaFullscreen, setShowMediaFullscreen] = useState(false)
  const [fullscreenType, setFullscreenType] = useState(null)
  const [mediaAppear, setMediaAppear] = useState(false)
  const [reachedBottom, setReachedBottom] = useState(false)
  const [fsAnim, setFsAnim] = useState(false)
  const contentRef = useRef(null)

  const [privacy, setPrivacy] = useState('public')
  const privacyOptions = [
    { value: 'public', label: 'Público' },
    { value: 'friends', label: 'Amigos' },
    { value: 'private', label: 'Apenas eu' }
  ]

  const [backgroundColor, setBackgroundColor] = useState(null)
  const [showColorPicker, setShowColorPicker] = useState(false)


  useEffect(() => {
    if (!imageFile) { setImagePreviewUrl(null); return }
    const url = URL.createObjectURL(imageFile)
    setImagePreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [imageFile])

  useEffect(() => {
    if (!videoFile) { setVideoPreviewUrl(null); return }
    const url = URL.createObjectURL(videoFile)
    setVideoPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [videoFile])

  useEffect(() => {
    if (!audioFile) { setAudioPreviewUrl(null); return }
    const url = URL.createObjectURL(audioFile)
    setAudioPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [audioFile])

  useEffect(() => {
    const el = contentRef.current
    if (!el) return
    const onScroll = () => {
      const threshold = 8
      const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - threshold
      setReachedBottom(atBottom)
    }
    onScroll()
    el.addEventListener('scroll', onScroll)
    return () => el.removeEventListener('scroll', onScroll)
  }, [contentRef, imageFile, videoFile])

  useEffect(() => {
    if (showMediaFullscreen) {
      requestAnimationFrame(() => setFsAnim(true))
    } else {
      setFsAnim(false)
    }
  }, [showMediaFullscreen])

  // Animate media preview when a file is selected
  useEffect(() => {
    if (imageFile || videoFile || audioFile) {
      requestAnimationFrame(() => setMediaAppear(true))
    } else {
      setMediaAppear(false)
    }
  }, [imageFile, videoFile, audioFile])

  const colorOptions = [
    { name: 'Sem cor', value: null, gradient: 'bg-white border-2 border-gray-300' },
    { name: 'Azul', value: 'blue', gradient: 'bg-gradient-to-br from-blue-400 to-blue-600' },
    { name: 'Verde', value: 'green', gradient: 'bg-gradient-to-br from-green-400 to-green-600' },
    { name: 'Roxo', value: 'purple', gradient: 'bg-gradient-to-br from-purple-400 to-purple-600' },
    { name: 'Rosa', value: 'pink', gradient: 'bg-gradient-to-br from-pink-400 to-pink-600' },
    { name: 'Laranja', value: 'orange', gradient: 'bg-gradient-to-br from-orange-400 to-orange-600' },
    { name: 'Vermelho', value: 'red', gradient: 'bg-gradient-to-br from-red-400 to-red-600' },
    { name: 'Vibe', value: 'vibe', gradient: 'bg-gradient-to-br from-vibe-blue to-vibe-blue-dark' },
    { name: 'Sunset', value: 'sunset', gradient: 'bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600' }
  ]

  // Process and normalize images to JPEG, keeping orientation and limiting size
  const processImageFile = async (file) => {
    const MAX_DIMENSION = 2048
    const TARGET_MIME = 'image/jpeg'
    let imageBitmap
    try {
      if ('createImageBitmap' in window) {
        imageBitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
      }
    } catch (e) {
      imageBitmap = null
    }

    if (!imageBitmap) {
      // Fallback using HTMLImageElement
      const objectUrl = URL.createObjectURL(file)
      try {
        const img = await new Promise((resolve, reject) => {
          const i = new Image()
          i.onload = () => resolve(i)
          i.onerror = reject
          i.src = objectUrl
        })
        imageBitmap = img
      } finally {
        URL.revokeObjectURL(objectUrl)
      }
    }

    const iw = imageBitmap.width
    const ih = imageBitmap.height
    const scale = Math.min(1, MAX_DIMENSION / Math.max(iw, ih))
    const tw = Math.max(1, Math.round(iw * scale))
    const th = Math.max(1, Math.round(ih * scale))

    const canvas = document.createElement('canvas')
    canvas.width = tw
    canvas.height = th
    const ctx = canvas.getContext('2d')
    ctx.drawImage(imageBitmap, 0, 0, tw, th)

    // Aim for <= ~6MB. Reduce quality progressively if needed
    let quality = 0.88
    let dataUrl = canvas.toDataURL(TARGET_MIME, quality)
    const approxBytes = () => Math.ceil((dataUrl.length - 'data:image/jpeg;base64,'.length) * 3 / 4)
    const MAX_BYTES = 6 * 1024 * 1024
    while (approxBytes() > MAX_BYTES && quality > 0.4) {
      quality = Math.max(0.4, quality - 0.08)
      dataUrl = canvas.toDataURL(TARGET_MIME, quality)
    }

    // Convert back to File for existing pipeline
    const res = await fetch(dataUrl)
    const blob = await res.blob()
    return new File([blob], file.name.replace(/\.(heic|heif|avif|png|webp)$/i, '.jpg'), { type: TARGET_MIME })
  }

  const handleFileUpload = async (file, type) => {
    if (type === 'image') {
      try {
        const processed = await processImageFile(file)
        setImageFile(processed)
        setVideoFile(null)
        setAudioFile(null)
        setPostType('image')
      } catch (e) {
        console.error('Falha ao processar imagem', e)
        setError('Formato de imagem não suportado pelo navegador. Tente JPEG/PNG/WEBP.')
        return
      }
    } else if (type === 'video') {
      if (file.type !== 'video/mp4') {
        setError('Vídeo suportado apenas em MP4.')
        return
      }
      setVideoFile(file)
      setImageFile(null)
      setAudioFile(null)
      setPostType('video')
    } else if (type === 'audio') {
      setAudioFile(file)
      setImageFile(null)
      setVideoFile(null)
      setPostType('audio')
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

  // Helpers for recipient search fallback when backend is offline
  const searchUsersLocalFallback = (q) => {
    const demoFriends = JSON.parse(localStorage.getItem('demo:friends') || '[]')
    if (demoFriends.length > 0) {
      const ql = q.toLowerCase()
      return demoFriends.filter(u => (u.firstName + ' ' + (u.lastName||'') + ' ' + (u.username||'')).toLowerCase().includes(ql)).slice(0,6)
    }
    const fallback = []
    if (user) {
      fallback.push({ id: `f_${user.id}_1`, firstName: 'Amigo', lastName: 'Demo', username: 'amigo_demo' })
      fallback.push({ id: `f_${user.id}_2`, firstName: 'Colega', lastName: 'Teste', username: 'colega_teste' })
    } else {
      fallback.push({ id: 'f_demo_1', firstName: 'Amigo', lastName: 'Demo', username: 'amigo_demo' })
    }
    return fallback.filter(u => (u.firstName + ' ' + (u.lastName||'') + ' ' + (u.username||'')).toLowerCase().includes(q.toLowerCase()))
  }

  const handleRecipientQueryChange = async (q) => {
    setTestimonialRecipientQuery(q)
    setTestimonialRecipient(null)
    if (!q || q.length < 2) { setTestimonialSearchResults([]); return }
    try {
      const res = await usersAPI.searchUsers(q, 6)
      setTestimonialSearchResults(res.data || [])
    } catch (e) {
      const local = searchUsersLocalFallback(q)
      setTestimonialSearchResults(local)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (postType !== 'testimonial' && !content.trim() && !imageFile && !videoFile && !audioFile) {
      setError('Por favor, adicione conteúdo ao seu post')
      return
    }

    setLoading(true)
    setError('')

    try {
      if (postType === 'testimonial') {
        // Ensure recipient
        if (!testimonialRecipient) {
          setError('Por favor selecione o amigo para quem enviar o depoimento')
          setLoading(false)
          return
        }
        const payload = {
          recipientId: testimonialRecipient.id,
          title: testimonialTitle,
          content: testimonialContentHtml || '',
          backgroundColor: testimonialBgColor,
          font: testimonialFont
        }
        try {
          const res = await testimonialsAPI.create(payload)
          const created = res.data
          onPost?.(created)
          resetAndClose()
          return
        } catch (err) {
          console.warn('Testimonials API failed, falling back to local storage', err)
          const demo = JSON.parse(localStorage.getItem('demo:testimonials') || '[]')
          const id = `demo_${Date.now()}`
          const created = { id, ...payload, authorId: user?.id || null, createdAt: new Date().toISOString(), isActive: true }
          demo.unshift(created)
          localStorage.setItem('demo:testimonials', JSON.stringify(demo))
          onPost?.(created)
          resetAndClose()
          return
        }
      }

      let postData = {
        content: content.trim(),
        type: postType,
        backgroundColor: postType === 'text' ? backgroundColor : null,
        privacy
      }

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

      if (audioFile) {
        const audioBase64 = await convertFileToBase64(audioFile)
        postData.audioUrl = audioBase64
        postData.type = 'audio'
      }

      const response = await postsAPI.createPost(postData)
      const created = response.data
      onPost?.(created)

      resetAndClose()
    } catch (error) {
      console.error('Error creating post:', error)
      setError(error.response?.data?.detail || 'Erro ao criar post')
    } finally {
      setLoading(false)
    }
  }

  const resetAndClose = () => {
    setContent('')
    setImageFile(null)
    setVideoFile(null)
    setAudioFile(null)
    setPostType('text')
    setBackgroundColor(null)
    setShowColorPicker(false)
    setError('')
    setPrivacy('public')
    setShowOptions(false)
    setShowMediaFullscreen(false)
    // Reset testimonial state
    setTestimonialTitle('')
    setTestimonialRecipientQuery('')
    setTestimonialRecipient(null)
    setTestimonialContentHtml('')
    setTestimonialFont('Montserrat')
    setTestimonialBgColor(null)
    setTestimonialTextColor('#000000')
    setTestimonialSearchResults([])
    if (testimonialEditorRef.current) testimonialEditorRef.current.innerHTML = ''
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white shadow-sm">
        <div className="flex items-center space-x-3">
          <button onClick={resetAndClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={24} className="text-gray-600" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">Criar post</h1>
        </div>
        <button
          onClick={handleSubmit}
          disabled={loading || (!content.trim() && !imageFile && !videoFile && !audioFile)}
          className="flex items-center space-x-2 bg-vibe-blue text-white px-6 py-2 rounded-full hover:bg-vibe-blue-dark disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          <Send size={18} />
          <span>{loading ? 'Publicando...' : 'Publicar'}</span>
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* User Info */}
        <div className="p-4 border-b border-gray-50">
          <div className="flex items-center space-x-3">
            {user?.avatar ? (
              <img src={user.avatar} alt="Avatar" className="w-12 h-12 rounded-full object-cover" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-vibe-blue flex items-center justify-center">
                <span className="text-white font-bold text-lg">{user?.firstName?.charAt(0)?.toUpperCase() || 'U'}</span>
              </div>
            )}
            <div>
              <p className="font-semibold text-gray-900">{user?.fullName || 'Usuário'}</p>
              <div className="flex items-center space-x-2">
                <Globe size={14} className="text-gray-500" />
                <div className="relative">
                  <select
                    value={privacy}
                    onChange={(e) => setPrivacy(e.target.value)}
                    className="text-sm text-gray-600 bg-gray-100 border-none rounded-full px-3 pr-8 py-1 focus:outline-none focus:ring-2 focus:ring-vibe-blue min-w-[140px] appearance-none"
                  >
                    {privacyOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Top tabs for Normal / Depoimento */}
          <div className="mt-4 flex items-center space-x-2">
            <button onClick={() => setPostType('text')} className={`px-3 py-1 rounded ${postType === 'text' ? 'bg-vibe-blue text-white' : 'bg-gray-100 text-gray-700'}`}>Normal</button>
            <button onClick={() => setPostType('testimonial')} className={`px-3 py-1 rounded ${postType === 'testimonial' ? 'bg-vibe-blue text-white' : 'bg-gray-100 text-gray-700'}`}>Depoimento</button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-4 overflow-y-auto" ref={contentRef}>
          {/* Image preview first when present */}
          {imageFile && (
            <div className={`mb-4 relative flex items-center justify-center transition-all duration-300 ${mediaAppear ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
              <img
                src={imagePreviewUrl || ''}
                alt="Imagem"
                className="max-h-80 w-auto object-contain rounded-lg cursor-pointer mx-auto"
                onClick={() => { setFullscreenType('image'); setShowMediaFullscreen(true) }}
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

          {/* Video preview */}
          {videoFile && (
            <div className={`mb-4 relative flex items-center justify-center transition-all duration-300 ${mediaAppear ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
              <video src={videoPreviewUrl || ''} controls className="max-h-80 w-auto object-contain rounded-lg cursor-pointer" onClick={() => { setFullscreenType('video'); setShowMediaFullscreen(true) }} />
              <button type="button" onClick={() => setVideoFile(null)} className="absolute top-2 right-2 p-1 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70">
                <X size={16} />
              </button>
            </div>
          )}

          {/* Audio preview */}
          {audioFile && (
            <div className="mb-4 relative">
              <audio src={audioPreviewUrl || ''} controls className="w-full" />
              <button type="button" onClick={() => setAudioFile(null)} className="absolute -top-3 right-0 p-1 text-gray-600 hover:text-gray-900">
                <X size={16} />
              </button>
            </div>
          )}

          {/* Text background preview */}
          {postType === 'text' && backgroundColor && content.trim() && (
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Preview:</p>
              <div className={`p-6 rounded-lg ${colorOptions.find(c => c.value === backgroundColor)?.gradient} min-h-[120px] flex items-center justify-center`}>
                <p className="text-white text-center font-medium text-lg leading-relaxed">{content}</p>
              </div>
            </div>
          )}

          {/* Testimonial editor */}
          {postType === 'testimonial' && (
            <div className="mb-4">
              <div className="mb-2">
                <input value={testimonialTitle} onChange={(e) => setTestimonialTitle(e.target.value)} placeholder="Título do depoimento" className="w-full p-2 border rounded" />
              </div>
              <div className="mb-2 relative">
                <input value={testimonialRecipientQuery} onChange={(e) => handleRecipientQueryChange(e.target.value)} placeholder="Marcar amigo (digite nome ou @usuario)" className="w-full p-2 border rounded" />
                {testimonialSearchResults.length > 0 && (
                  <div className="absolute z-50 bg-white border rounded mt-1 w-full max-h-40 overflow-auto">
                    {testimonialSearchResults.map(u => (
                      <div key={u.id} className="p-2 hover:bg-gray-50 cursor-pointer" onClick={() => { setTestimonialRecipient(u); setTestimonialRecipientQuery(u.username || u.firstName); setTestimonialSearchResults([]) }}>{u.firstName} {u.lastName} @{u.username}</div>
                    ))}
                  </div>
                )}
              </div>

              {/* Toolbar */}
              <div className="flex items-center space-x-2 mb-2 overflow-x-auto whitespace-nowrap px-2 py-1">
                <button type="button" onClick={() => document.execCommand('bold')} className="px-2 py-1 border rounded">B</button>
                <button type="button" onClick={() => document.execCommand('italic')} className="px-2 py-1 border rounded">I</button>
                <button type="button" onClick={() => document.execCommand('underline')} className="px-2 py-1 border rounded">U</button>

                <select value={testimonialFont} onChange={(e) => { setTestimonialFont(e.target.value); try { document.execCommand('fontName', false, e.target.value) } catch(e){} }} className="p-1 border rounded">
                  <option>Montserrat</option>
                  <option>Tahoma</option>
                  <option>Comic Neue</option>
                  <option>Impact</option>
                  <option>Sans-Serif</option>
                  <option>Verdana</option>
                  <option>Mathematical Sans-Serif Bold</option>
                  <option>Mathematical Bold</option>
                </select>

                <input title="Cor do texto" type="color" value={testimonialTextColor} onChange={(e) => { setTestimonialTextColor(e.target.value); try { document.execCommand('foreColor', false, e.target.value) } catch(e){} }} className="w-8 h-8 p-0 border rounded" />

                {/* Shadow controls */}
                <input title="Cor da sombra" type="color" value={testimonialShadowColor} onChange={(e)=>setTestimonialShadowColor(e.target.value)} className="w-8 h-8 p-0 border rounded" />
                <div className="flex items-center space-x-1">
                  <input title="Deslocamento" type="range" min="0" max="12" value={testimonialShadowOffset} onChange={(e)=>setTestimonialShadowOffset(Number(e.target.value))} className="w-20" />
                  <input title="Blur" type="range" min="0" max="24" value={testimonialShadowBlur} onChange={(e)=>setTestimonialShadowBlur(Number(e.target.value))} className="w-20" />
                </div>
                <button type="button" onClick={() => {
                  try {
                    const sel = window.getSelection(); if (!sel || sel.rangeCount === 0) return
                    const range = sel.getRangeAt(0)
                    const span = document.createElement('span')
                    span.style.textShadow = `${testimonialShadowOffset}px ${testimonialShadowOffset}px ${testimonialShadowBlur}px ${testimonialShadowColor}`
                    range.surroundContents(span)
                  } catch (e) { console.warn('shadow failed', e) }
                }} className="px-2 py-1 border rounded">Aplicar sombra</button>

                <label className="flex items-center space-x-2 px-2 py-1 border rounded">
                  <input type="checkbox" checked={testimonialShadowEnabled} onChange={(e)=>setTestimonialShadowEnabled(e.target.checked)} />
                  <span className="text-sm">Sombra no título</span>
                </label>

                {/* Background color picker + palette */}
                <input title="Cor de fundo" type="color" value={testimonialBgColor || '#ffffff'} onChange={(e)=>setTestimonialBgColor(e.target.value)} className="w-8 h-8 p-0 border rounded" />
                <div className="flex items-center space-x-1">
                  {['#ffffff','#fef3c7','#dbeafe','#ecfccb','#fee2e2','#fce7f3','#e6fffa'].map(c => (
                    <button key={c} onClick={()=>setTestimonialBgColor(c)} className={`w-6 h-6 rounded-sm border`} style={{ background: c }} aria-label={`bg-${c}`} />
                  ))}
                </div>
                {testimonialBgColor && (<button type="button" onClick={() => setTestimonialBgColor(null)} className="px-2 py-1 border rounded text-red-600">X</button>)}
              </div>

              <div contentEditable ref={testimonialEditorRef} onInput={(e) => setTestimonialContentHtml(e.currentTarget.innerHTML)} className="min-h-[120px] border p-3 rounded" style={{ fontFamily: testimonialFont, color: testimonialTextColor }}></div>

              <div className="mt-3">
                <p className="text-sm text-gray-600 mb-2">Pré-visualização:</p>
                <div className={`p-6 rounded-lg min-h-[120px] flex flex-col`} style={{ background: testimonialBgColor || 'transparent' }}>
                  <h3 style={{ fontFamily: testimonialFont, color: testimonialTextColor, textShadow: testimonialShadowEnabled ? `${testimonialShadowOffset}px ${testimonialShadowOffset}px ${testimonialShadowBlur}px ${testimonialShadowColor}` : 'none' }} className="font-semibold text-lg">{testimonialTitle}</h3>
                  <div className="mt-2" dangerouslySetInnerHTML={{ __html: testimonialContentHtml }} style={{ fontFamily: testimonialFont, color: testimonialTextColor, textShadow: testimonialShadowEnabled ? `${testimonialShadowOffset}px ${testimonialShadowOffset}px ${testimonialShadowBlur}px ${testimonialShadowColor}` : 'none' }} />
                  {testimonialRecipient && <div className="mt-3 text-sm text-gray-500">Para: {testimonialRecipient.firstName} {testimonialRecipient.lastName} @{testimonialRecipient.username}</div>}
                </div>
              </div>
            </div>
          )}

          {/* Editor */}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="O que está acontecendo?"
            className={`w-full ${imageFile || videoFile ? 'h-24' : 'h-32'} text-lg placeholder-gray-400 border-none resize-none focus:outline-none`}
            maxLength={500}
          />

          <div className="flex justify-end mb-4">
            <span className="text-sm text-gray-500">{content.length}/500</span>
          </div>
        </div>

        {/* Actions */}
        <div className="border-t border-gray-100 bg-white">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-1">
              <label className="p-3 hover:bg-blue-50 rounded-full cursor-pointer group" title="Adicionar foto">
                <Image size={24} className="text-blue-500 group-hover:text-blue-600" />
                <input type="file" accept="image/*" onChange={async (e) => { const f = e.target.files?.[0]; if (f) await handleFileUpload(f, 'image') }} className="hidden" />
              </label>
              <label className="p-3 hover:bg-green-50 rounded-full cursor-pointer group" title="Adicionar vídeo">
                <Video size={24} className="text-green-500 group-hover:text-green-600" />
                <input type="file" accept="video/mp4" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f, 'video') }} className="hidden" />
              </label>
              <label className="p-3 hover:bg-purple-50 rounded-full cursor-pointer group" title="Adicionar áudio">
                <Mic size={24} className="text-purple-500 group-hover:text-purple-600" />
                <input type="file" accept="audio/*" onChange={(e) => e.target.files[0] && handleFileUpload(e.target.files[0], 'audio')} className="hidden" />
              </label>
              <button type="button" className="p-3 hover:bg-orange-50 rounded-full transition-colors group" title="Criar enquete">
                <BarChart3 size={24} className="text-orange-500 group-hover:text-orange-600" />
              </button>
              <button type="button" className="p-3 hover:bg-red-50 rounded-full transition-colors group" title="Criar evento">
                <Calendar size={24} className="text-red-500 group-hover:text-red-600" />
              </button>
              <button type="button" onClick={() => setShowOptions(!showOptions)} className="p-3 hover:bg-gray-50 rounded-full transition-colors" title="Mais opções">
                <Plus size={24} className="text-gray-600" />
              </button>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Globe size={16} />
              <span>Todos podem responder</span>
            </div>
          </div>

          {showOptions && (
            <div className="border-t border-gray-50 p-4 space-y-3">
              <button type="button" className="flex items-center space-x-3 w-full p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <MapPin size={20} className="text-gray-500" />
                <span className="text-gray-700">Adicionar localização</span>
              </button>
              <button type="button" className="flex items-center space-x-3 w-full p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <Users size={20} className="text-gray-500" />
                <span className="text-gray-700">Marcar pessoas</span>
              </button>
              <button type="button" className="flex items-center space-x-3 w-full p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <Smile size={20} className="text-gray-500" />
                <span className="text-gray-700">Adicionar emojis</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen media viewer */}
      {showMediaFullscreen && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
          {fullscreenType === 'image' && (
            <img src={imagePreviewUrl || ''} alt="Imagem" className="max-w-[90vw] max-h-[90vh] object-contain" />
          )}
          {fullscreenType === 'video' && (
            <video src={videoPreviewUrl || ''} controls className="max-w-[90vw] max-h-[90vh] object-contain" />
          )}
          <button
            onClick={() => setShowMediaFullscreen(false)}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full"
            aria-label="Fechar"
          >
            <X size={24} className="text-white" />
          </button>
        </div>
      )}

      {error && (
        <div className="absolute bottom-4 left-4 right-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}
    </div>
  )
}

export default PostModal
