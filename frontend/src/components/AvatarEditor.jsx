import React, { useState, useRef, useCallback, useEffect } from 'react'
import { X, RotateCcw, ZoomIn, ZoomOut, Move, Check, Camera } from 'lucide-react'

const AvatarEditor = ({ isOpen, onClose, onSave, currentImage }) => {
  const [image, setImage] = useState(null)
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [loading, setLoading] = useState(false)
  const [caption, setCaption] = useState('')
  const [originalDataUrl, setOriginalDataUrl] = useState(null)
  
  const canvasRef = useRef(null)
  const imageRef = useRef(null)
  const fileInputRef = useRef(null)
  const containerRef = useRef(null)

  // Carregar imagem quando o modal abrir
  useEffect(() => {
    if (isOpen && currentImage) {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        setImage(img)
        centerImage(img)
      }
      img.src = currentImage
      setOriginalDataUrl(currentImage)
    }
  }, [isOpen, currentImage])

  const getMinCoverScale = (img) => {
    const canvasSize = 300
    // To fully cover the circular crop, the smaller image side must fill the canvas
    return canvasSize / Math.min(img.width, img.height)
  }

  const clampPosition = (x, y, scaledWidth, scaledHeight) => {
    const canvasSize = 300
    // If image is larger than canvas, confine so edges can't reveal background
    const minX = Math.min(0, canvasSize - scaledWidth)
    const maxX = Math.max(0, canvasSize - scaledWidth)
    const minY = Math.min(0, canvasSize - scaledHeight)
    const maxY = Math.max(0, canvasSize - scaledHeight)

    // When scaled dimension is smaller than canvas (shouldn't happen due to min scale), center it
    const centeredX = (canvasSize - scaledWidth) / 2
    const centeredY = (canvasSize - scaledHeight) / 2

    const clampedX = scaledWidth >= canvasSize ? Math.max(minX, Math.min(x, 0)) : centeredX
    const clampedY = scaledHeight >= canvasSize ? Math.max(minY, Math.min(y, 0)) : centeredY
    return { x: clampedX, y: clampedY }
  }

  const centerImage = (img) => {
    if (!img) return
    const canvas = canvasRef.current
    if (!canvas) return

    const minScale = getMinCoverScale(img)
    setScale(minScale)
    setPosition({ x: 0, y: 0 })
  }

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar arquivo
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      alert('Formato não suportado. Use JPEG, PNG ou WebP.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Arquivo muito grande. Máximo 5MB.')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target.result
      setOriginalDataUrl(dataUrl)
      const img = new Image()
      img.onload = () => {
        setImage(img)
        centerImage(img)
      }
      img.src = dataUrl
    }
    reader.readAsDataURL(file)
  }

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx || !image) return

    const canvasSize = 300
    canvas.width = canvasSize
    canvas.height = canvasSize

    // Limpar canvas
    ctx.clearRect(0, 0, canvasSize, canvasSize)

    // Salvar estado do contexto
    ctx.save()

    // Criar máscara circular
    ctx.beginPath()
    ctx.arc(canvasSize / 2, canvasSize / 2, canvasSize / 2, 0, Math.PI * 2)
    ctx.clip()

    // Calcular posição e tamanho da imagem
    const scaledWidth = image.width * scale
    const scaledHeight = image.height * scale
    const x = (canvasSize - scaledWidth) / 2 + position.x
    const y = (canvasSize - scaledHeight) / 2 + position.y

    // Desenhar imagem
    ctx.drawImage(image, x, y, scaledWidth, scaledHeight)

    // Restaurar contexto
    ctx.restore()

    // Desenhar borda circular
    ctx.strokeStyle = '#e5e7eb'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(canvasSize / 2, canvasSize / 2, canvasSize / 2 - 1, 0, Math.PI * 2)
    ctx.stroke()
  }, [image, scale, position])

  useEffect(() => {
    drawCanvas()
  }, [drawCanvas])

  const handleMouseDown = (e) => {
    setIsDragging(true)
    const rect = canvasRef.current.getBoundingClientRect()
    setDragStart({
      x: e.clientX - rect.left - position.x,
      y: e.clientY - rect.top - position.y
    })
  }

  const handleMouseMove = (e) => {
    if (!isDragging) return
    
    const rect = canvasRef.current.getBoundingClientRect()
    const newX = e.clientX - rect.left - dragStart.x
    const newY = e.clientY - rect.top - dragStart.y
    
    setPosition({ x: newX, y: newY })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Touch handlers for drag and pinch-to-zoom
  const pinchRef = useRef({ active: false, startDistance: 0, startScale: 1 })

  const getTouchPoint = (touch, rect) => ({ x: touch.clientX - rect.left, y: touch.clientY - rect.top })

  const distanceBetween = (t1, t2) => {
    const dx = t2.clientX - t1.clientX
    const dy = t2.clientY - t1.clientY
    return Math.hypot(dx, dy)
  }

  const handleTouchStart = (e) => {
    if (!canvasRef.current) return
    const rect = canvasRef.current.getBoundingClientRect()
    if (e.touches.length === 1) {
      setIsDragging(true)
      const p = getTouchPoint(e.touches[0], rect)
      setDragStart({ x: p.x - position.x, y: p.y - position.y })
    } else if (e.touches.length === 2) {
      pinchRef.current = {
        active: true,
        startDistance: distanceBetween(e.touches[0], e.touches[1]),
        startScale: scale,
      }
      setIsDragging(false)
    }
  }

  const handleTouchMove = (e) => {
    if (!canvasRef.current) return
    const rect = canvasRef.current.getBoundingClientRect()
    if (e.touches.length === 1 && isDragging) {
      const p = getTouchPoint(e.touches[0], rect)
      setPosition({ x: p.x - dragStart.x, y: p.y - dragStart.y })
    } else if (e.touches.length === 2 && pinchRef.current.active) {
      const newDist = distanceBetween(e.touches[0], e.touches[1])
      const factor = newDist / (pinchRef.current.startDistance || 1)
      const next = Math.min(3, Math.max(0.5, pinchRef.current.startScale * factor))
      setScale(next)
    }
  }

  const handleTouchEnd = () => {
    if (pinchRef.current.active) {
      pinchRef.current.active = false
    }
    setIsDragging(false)
  }

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev * 1.1, 3))
  }

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev / 1.1, 0.5))
  }

  const handleReset = () => {
    if (image) {
      centerImage(image)
    }
  }

  const handleSave = async () => {
    if (!image) return

    setLoading(true)
    try {
      const canvas = canvasRef.current
      canvas.toBlob(async (blob) => {
        const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' })
        await onSave(file, caption, originalDataUrl)
        onClose()
      }, 'image/jpeg', 0.9)
    } catch (error) {
      console.error('Erro ao salvar avatar:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setImage(null)
    setScale(1)
    setPosition({ x: 0, y: 0 })
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="bg-white h-full w-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0 bg-white">
          <h2 className="text-lg font-semibold">Editar foto de perfil</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 p-6 space-y-6 overflow-y-auto">
          {/* Canvas de edição */}
          <div className="flex justify-center">
            <div 
              ref={containerRef}
              className="relative"
            >
              <canvas
                ref={canvasRef}
                width={300}
                height={300}
                className="border border-gray-300 rounded-full cursor-move"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                style={{ touchAction: 'none' }}
              />
              {!image && (
                <div
                  className="absolute inset-0 flex items-center justify-center cursor-pointer hover:bg-gray-50 hover:bg-opacity-50 rounded-full transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="text-center text-gray-500">
                    <Camera size={48} className="mx-auto mb-2" />
                    <p className="text-sm">Selecione uma foto</p>
                  </div>
                </div>
              )}

              {image && (
                <div className="absolute top-2 right-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-black bg-opacity-50 text-white p-1.5 rounded-full hover:bg-opacity-70 transition-all text-xs"
                    title="Trocar foto"
                  >
                    <Camera size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Controles de zoom e posição */}
          {image && (
            <div className="space-y-4">
              {/* Zoom */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Zoom
                </label>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleZoomOut}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <ZoomOut size={16} />
                  </button>
                  <input
                    type="range"
                    min={Math.min(scale, 1e9) && image ? (300 / Math.max(image.width, image.height)) : 0.5}
                    max="3"
                    step="0.1"
                    value={scale}
                    onChange={(e) => setScale(parseFloat(e.target.value))}
                    className="flex-1"
                  />
                  <button
                    onClick={handleZoomIn}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <ZoomIn size={16} />
                  </button>
                </div>
                <div className="text-center text-sm text-gray-500 mt-1">
                  {Math.round(scale * 100)}%
                </div>
              </div>

              {/* Instruções */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <Move size={16} className="text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium">Como usar:</p>
                    <ul className="mt-1 space-y-1 text-xs">
                      <li>• Arraste a imagem para posicioná-la</li>
                      <li>• Use o controle de zoom para ajustar o tamanho</li>
                      <li>• Clique em "Resetar" para centralizar</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Caption input */}
        <div className="space-y-2 px-6">
          <label className="block text-sm font-medium text-gray-700">Descrição (opcional)</label>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Adicione uma descrição para sua nova foto de perfil"
            maxLength={500}
            className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-vibe-blue focus:border-transparent"
            rows={3}
          />
          <div className="text-xs text-gray-500">{caption.length}/500</div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 flex-shrink-0 bg-white">
          <button
            onClick={handleReset}
            disabled={!image}
            className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
          >
            <RotateCcw size={16} />
            <span>Resetar</span>
          </button>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={!image || loading}
              className="flex items-center space-x-2 bg-vibe-blue text-white px-6 py-2 rounded-lg hover:bg-vibe-blue-dark disabled:opacity-50"
            >
              <Check size={16} />
              <span>{loading ? 'Salvando...' : 'Salvar'}</span>
            </button>
          </div>
        </div>

        {/* Input file hidden */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    </div>
  )
}

export default AvatarEditor
