import React, { useState, useRef, useCallback, useEffect } from 'react'
import { X, RotateCcw, ZoomIn, ZoomOut, Move, Check, Upload } from 'lucide-react'

const CoverEditor = ({ isOpen, onClose, onSave, currentImage }) => {
  const [image, setImage] = useState(null)
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [loading, setLoading] = useState(false)
  
  const canvasRef = useRef(null)
  const imageRef = useRef(null)
  const fileInputRef = useRef(null)
  const containerRef = useRef(null)

  // Carregar imagem quando o modal abrir
  useEffect(() => {
    if (isOpen) {
      if (currentImage) {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => {
          setImage(img)
          centerImage(img)
        }
        img.src = currentImage
      } else {
        // Se não há imagem atual, abrir seletor automaticamente após um pequeno delay
        setTimeout(() => {
          fileInputRef.current?.click()
        }, 300)
      }
    }
  }, [isOpen, currentImage])

  const centerImage = (img) => {
    if (!img) return
    const canvas = canvasRef.current
    if (!canvas) return

    const canvasWidth = 400
    const canvasHeight = 200
    const aspectRatio = img.width / img.height
    const canvasAspectRatio = canvasWidth / canvasHeight
    
    // Calcular escala inicial para cobrir toda a área
    let initialScale
    if (aspectRatio > canvasAspectRatio) {
      // Imagem mais larga, ajustar pela altura
      initialScale = canvasHeight / img.height
    } else {
      // Imagem mais alta, ajustar pela largura
      initialScale = canvasWidth / img.width
    }
    
    setScale(initialScale)
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
      const img = new Image()
      img.onload = () => {
        setImage(img)
        centerImage(img)
      }
      img.src = event.target.result
    }
    reader.readAsDataURL(file)
  }

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx || !image) return

    const canvasWidth = 400
    const canvasHeight = 200
    canvas.width = canvasWidth
    canvas.height = canvasHeight

    // Limpar canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight)

    // Calcular posição e tamanho da imagem
    const scaledWidth = image.width * scale
    const scaledHeight = image.height * scale
    const x = (canvasWidth - scaledWidth) / 2 + position.x
    const y = (canvasHeight - scaledHeight) / 2 + position.y

    // Desenhar imagem
    ctx.drawImage(image, x, y, scaledWidth, scaledHeight)

    // Desenhar borda
    ctx.strokeStyle = '#e5e7eb'
    ctx.lineWidth = 2
    ctx.strokeRect(0, 0, canvasWidth, canvasHeight)
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
        const file = new File([blob], 'cover.jpg', { type: 'image/jpeg' })
        await onSave(file)
        onClose()
      }, 'image/jpeg', 0.9)
    } catch (error) {
      console.error('Erro ao salvar capa:', error)
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
          <div className="flex items-center space-x-3">
            <h2 className="text-lg font-semibold">Editar foto de capa</h2>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center space-x-2 px-3 py-1.5 bg-vibe-blue text-white text-sm rounded-lg hover:bg-vibe-blue-dark"
            >
              <Upload size={16} />
              <span>{image ? 'Trocar foto' : 'Selecionar foto'}</span>
            </button>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 p-6 space-y-6 overflow-y-auto">
          {!image ? (
            /* Área de seleção de foto */
            <div className="flex flex-col items-center justify-center space-y-6 py-12">
              <div className="text-center">
                <Upload size={64} className="mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Selecione uma foto de capa</h3>
                <p className="text-gray-500 text-sm mb-6">Escolha uma imagem que represente você</p>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-vibe-blue text-white px-6 py-3 rounded-lg hover:bg-vibe-blue-dark transition-colors"
                >
                  Escolher da galeria
                </button>
              </div>

              <div className="w-full max-w-sm">
                <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6">
                  <div className="text-center text-sm text-gray-500">
                    <p>Formatos aceitos: JPEG, PNG, WebP</p>
                    <p>Tamanho máximo: 5MB</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Canvas de edição */
            <div className="flex justify-center">
              <div
                ref={containerRef}
                className="relative"
              >
                <canvas
                  ref={canvasRef}
                  width={400}
                  height={200}
                  className="border border-gray-300 rounded-lg cursor-move"
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  style={{ touchAction: 'none' }}
                />

                <div className="absolute top-2 right-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-black bg-opacity-50 text-white p-1.5 rounded-full hover:bg-opacity-70 transition-all text-xs"
                    title="Trocar foto"
                  >
                    <Upload size={14} />
                  </button>
                </div>
              </div>
            </div>
          )}

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
                    min="0.5"
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
                      <li>• Mova para cima/baixo e lados conforme necessário</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

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

export default CoverEditor
