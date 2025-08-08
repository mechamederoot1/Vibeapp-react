import React, { useState, useRef, useEffect } from 'react'
import { 
  X, Type, Palette, Eraser, Send, Undo, Redo, 
  Move, AlignLeft, AlignCenter, AlignRight,
  Bold, Italic, Underline, ZoomIn, ZoomOut
} from 'lucide-react'

const StoryPhotoEditor = ({ 
  imageUrl, 
  isOpen, 
  onClose, 
  onPublish,
  textElements = [],
  onUpdateTextElements 
}) => {
  const [activeTool, setActiveTool] = useState('move') // move, draw, erase, text
  const [drawingColor, setDrawingColor] = useState('#ffffff')
  const [brushSize, setBrushSize] = useState(5)
  const [isDrawing, setIsDrawing] = useState(false)
  const [showTextEditor, setShowTextEditor] = useState(false)
  const [selectedTextId, setSelectedTextId] = useState(null)
  const [newTextPosition, setNewTextPosition] = useState(null)
  
  const canvasRef = useRef(null)
  const imageRef = useRef(null)
  const containerRef = useRef(null)
  
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 })
  const [paths, setPaths] = useState([])
  const [undoStack, setUndoStack] = useState([])
  const [redoStack, setRedoStack] = useState([])

  // Drawing colors
  const colors = [
    '#ffffff', '#000000', '#ff0000', '#00ff00', '#0000ff',
    '#ffff00', '#ff00ff', '#00ffff', '#ffa500', '#800080',
    '#ffc0cb', '#a52a2a', '#808080', '#90ee90', '#87ceeb'
  ]

  // Font options
  const fontOptions = [
    { id: 'font-1', name: 'Clássica', class: 'font-serif' },
    { id: 'font-2', name: 'Moderna', class: 'font-sans' },
    { id: 'font-3', name: 'Mono', class: 'font-mono' },
    { id: 'font-4', name: 'Cursiva', class: 'font-serif italic' },
    { id: 'font-5', name: 'Bold', class: 'font-sans font-bold' }
  ]

  useEffect(() => {
    if (isOpen && containerRef.current) {
      // Set canvas size to match container
      const rect = containerRef.current.getBoundingClientRect()
      setCanvasSize({ width: rect.width, height: rect.height })
    }
  }, [isOpen])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // Draw all paths
    paths.forEach(path => {
      if (path.tool === 'draw') {
        ctx.strokeStyle = path.color
        ctx.lineWidth = path.size
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.globalCompositeOperation = 'source-over'
        
        ctx.beginPath()
        path.points.forEach((point, index) => {
          if (index === 0) {
            ctx.moveTo(point.x, point.y)
          } else {
            ctx.lineTo(point.x, point.y)
          }
        })
        ctx.stroke()
      } else if (path.tool === 'erase') {
        ctx.globalCompositeOperation = 'destination-out'
        ctx.lineWidth = path.size
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        
        ctx.beginPath()
        path.points.forEach((point, index) => {
          if (index === 0) {
            ctx.moveTo(point.x, point.y)
          } else {
            ctx.lineTo(point.x, point.y)
          }
        })
        ctx.stroke()
      }
    })
  }, [paths])

  const getCanvasCoordinates = (e) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    }
  }

  const handleMouseDown = (e) => {
    if (activeTool === 'text') {
      const coords = getCanvasCoordinates(e)
      setNewTextPosition({
        x: (coords.x / canvasSize.width) * 100,
        y: (coords.y / canvasSize.height) * 100
      })
      addTextElement(coords)
      return
    }

    if (activeTool === 'move') return

    setIsDrawing(true)
    const coords = getCanvasCoordinates(e)

    const newPath = {
      id: Date.now(),
      tool: activeTool,
      color: drawingColor,
      size: brushSize,
      points: [coords]
    }
    
    // Save current state for undo
    setUndoStack(prev => [...prev, paths])
    setRedoStack([])
    
    setPaths(prev => [...prev, newPath])
  }

  const handleMouseMove = (e) => {
    if (!isDrawing || activeTool === 'move' || activeTool === 'text') return

    const coords = getCanvasCoordinates(e)
    setPaths(prev => {
      const newPaths = [...prev]
      const currentPath = newPaths[newPaths.length - 1]
      if (currentPath) {
        currentPath.points.push(coords)
      }
      return newPaths
    })
  }

  const handleMouseUp = () => {
    setIsDrawing(false)
  }

  const addTextElement = (position = null) => {
    const newText = {
      id: Date.now(),
      content: 'Seu texto aqui',
      x: position ? (position.x / canvasSize.width) * 100 : 50,
      y: position ? (position.y / canvasSize.height) * 100 : 50,
      font: 'font-sans',
      size: 'text-xl',
      color: '#ffffff',
      align: 'center',
      style: []
    }
    
    const updatedElements = [...textElements, newText]
    onUpdateTextElements?.(updatedElements)
    setSelectedTextId(newText.id)
    setShowTextEditor(true)
  }

  const updateTextElement = (id, updates) => {
    const updatedElements = textElements.map(el => 
      el.id === id ? { ...el, ...updates } : el
    )
    onUpdateTextElements?.(updatedElements)
  }

  const removeTextElement = (id) => {
    const updatedElements = textElements.filter(el => el.id !== id)
    onUpdateTextElements?.(updatedElements)
    setSelectedTextId(null)
    setShowTextEditor(false)
  }

  const handleUndo = () => {
    if (undoStack.length > 0) {
      const previousState = undoStack[undoStack.length - 1]
      setRedoStack(prev => [...prev, paths])
      setPaths(previousState)
      setUndoStack(prev => prev.slice(0, -1))
    }
  }

  const handleRedo = () => {
    if (redoStack.length > 0) {
      const nextState = redoStack[redoStack.length - 1]
      setUndoStack(prev => [...prev, paths])
      setPaths(nextState)
      setRedoStack(prev => prev.slice(0, -1))
    }
  }

  const selectedText = textElements.find(el => el.id === selectedTextId)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Main content area */}
      <div 
        ref={containerRef}
        className="flex-1 relative overflow-hidden"
        style={{ height: '100vh' }}
      >
        {/* Background image */}
        {imageUrl && (
          <img
            ref={imageRef}
            src={imageUrl}
            alt="Story background"
            className="absolute inset-0 w-full h-full object-cover"
            style={{ zIndex: 1 }}
          />
        )}

        {/* Drawing canvas */}
        <canvas
          ref={canvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          className="absolute inset-0 cursor-crosshair"
          style={{ zIndex: 2 }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => setIsDrawing(false)}
        />

        {/* Text elements */}
        <div className="absolute inset-0" style={{ zIndex: 3 }}>
          {textElements.map((element) => (
            <div
              key={element.id}
              className={`absolute cursor-move ${element.font} ${element.size} ${
                element.color.startsWith('#') ? '' : element.color
              } ${element.align === 'center' ? 'text-center' : element.align === 'right' ? 'text-right' : 'text-left'} select-none`}
              style={{
                left: `${element.x}%`,
                top: `${element.y}%`,
                transform: 'translate(-50%, -50%)',
                maxWidth: '80%',
                color: element.color.startsWith('#') ? element.color : undefined,
                fontWeight: element.style.includes('bold') ? 'bold' : 'normal',
                fontStyle: element.style.includes('italic') ? 'italic' : 'normal',
                textDecoration: element.style.includes('underline') ? 'underline' : 'none',
                textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
              }}
              onClick={() => {
                setSelectedTextId(element.id)
                setShowTextEditor(true)
              }}
            >
              {element.content}
            </div>
          ))}
        </div>
      </div>

      {/* Footer controls */}
      <div className="bg-black bg-opacity-70 p-4 space-y-4" style={{ zIndex: 10 }}>
        {/* Tool selection */}
        <div className="flex items-center justify-center space-x-4">
          <button
            onClick={() => setActiveTool('move')}
            className={`p-3 rounded-full ${activeTools === 'move' ? 'bg-blue-600' : 'bg-gray-600'} text-white`}
          >
            <Move size={20} />
          </button>
          <button
            onClick={() => setActiveTool('draw')}
            className={`p-3 rounded-full ${activeTools === 'draw' ? 'bg-blue-600' : 'bg-gray-600'} text-white`}
          >
            <Palette size={20} />
          </button>
          <button
            onClick={() => setActiveTool('erase')}
            className={`p-3 rounded-full ${activeTools === 'erase' ? 'bg-blue-600' : 'bg-gray-600'} text-white`}
          >
            <Eraser size={20} />
          </button>
          <button
            onClick={() => setActiveTool('text')}
            className={`p-3 rounded-full ${activeTools === 'text' ? 'bg-blue-600' : 'bg-gray-600'} text-white`}
          >
            <Type size={20} />
          </button>
        </div>

        {/* Tool-specific controls */}
        {activeTools === 'draw' && (
          <div className="flex items-center justify-center space-x-4">
            {/* Color palette */}
            <div className="flex space-x-2">
              {colors.map(color => (
                <button
                  key={color}
                  onClick={() => setDrawingColor(color)}
                  className={`w-8 h-8 rounded-full border-2 ${
                    drawingColor === color ? 'border-white' : 'border-gray-400'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            
            {/* Brush size */}
            <div className="flex items-center space-x-2 text-white">
              <span className="text-sm">Tamanho:</span>
              <input
                type="range"
                min="1"
                max="20"
                value={brushSize}
                onChange={(e) => setBrushSize(parseInt(e.target.value))}
                className="w-20"
              />
              <span className="text-sm w-8">{brushSize}</span>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            <button
              onClick={handleUndo}
              disabled={undoStack.length === 0}
              className="p-2 bg-gray-600 text-white rounded disabled:opacity-50"
            >
              <Undo size={16} />
            </button>
            <button
              onClick={handleRedo}
              disabled={redoStack.length === 0}
              className="p-2 bg-gray-600 text-white rounded disabled:opacity-50"
            >
              <Redo size={16} />
            </button>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded"
            >
              Cancelar
            </button>
            <button
              onClick={() => onPublish?.()}
              className="px-6 py-2 bg-blue-600 text-white rounded flex items-center space-x-2"
            >
              <Send size={16} />
              <span>Publicar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Text editor modal */}
      {showTextEditor && selectedText && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center" style={{ zIndex: 20 }}>
          <div className="bg-gray-900 rounded-lg p-6 max-w-sm w-full mx-4 text-white space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Editar Texto</h3>
              <button
                onClick={() => removeTextElement(selectedTextId)}
                className="text-red-400 hover:text-red-300"
              >
                <X size={16} />
              </button>
            </div>

            {/* Content */}
            <textarea
              value={selectedText.content}
              onChange={(e) => updateTextElement(selectedTextId, { content: e.target.value })}
              className="w-full p-3 bg-gray-800 rounded text-white resize-none"
              rows={3}
              placeholder="Digite seu texto..."
            />

            {/* Font */}
            <div>
              <label className="block text-sm font-medium mb-2">Fonte</label>
              <select
                value={selectedText.font}
                onChange={(e) => updateTextElement(selectedTextId, { font: e.target.value })}
                className="w-full p-2 bg-gray-800 rounded text-white"
              >
                {fontOptions.map(font => (
                  <option key={font.id} value={font.class}>{font.name}</option>
                ))}
              </select>
            </div>

            {/* Size */}
            <div>
              <label className="block text-sm font-medium mb-2">Tamanho</label>
              <select
                value={selectedText.size}
                onChange={(e) => updateTextElement(selectedTextId, { size: e.target.value })}
                className="w-full p-2 bg-gray-800 rounded text-white"
              >
                <option value="text-sm">Pequeno</option>
                <option value="text-lg">Médio</option>
                <option value="text-xl">Grande</option>
                <option value="text-2xl">Muito Grande</option>
                <option value="text-4xl">Gigante</option>
              </select>
            </div>

            {/* Color */}
            <div>
              <label className="block text-sm font-medium mb-2">Cor</label>
              <div className="grid grid-cols-5 gap-2">
                {colors.map(color => (
                  <button
                    key={color}
                    onClick={() => updateTextElement(selectedTextId, { color })}
                    className={`w-8 h-8 rounded-full border-2 ${
                      selectedText.color === color ? 'border-white' : 'border-gray-600'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            {/* Alignment */}
            <div>
              <label className="block text-sm font-medium mb-2">Alinhamento</label>
              <div className="flex space-x-2">
                <button
                  onClick={() => updateTextElement(selectedTextId, { align: 'left' })}
                  className={`p-2 rounded ${selectedText.align === 'left' ? 'bg-blue-600' : 'bg-gray-600'}`}
                >
                  <AlignLeft size={16} />
                </button>
                <button
                  onClick={() => updateTextElement(selectedTextId, { align: 'center' })}
                  className={`p-2 rounded ${selectedText.align === 'center' ? 'bg-blue-600' : 'bg-gray-600'}`}
                >
                  <AlignCenter size={16} />
                </button>
                <button
                  onClick={() => updateTextElement(selectedTextId, { align: 'right' })}
                  className={`p-2 rounded ${selectedText.align === 'right' ? 'bg-blue-600' : 'bg-gray-600'}`}
                >
                  <AlignRight size={16} />
                </button>
              </div>
            </div>

            {/* Styles */}
            <div>
              <label className="block text-sm font-medium mb-2">Estilo</label>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    const styles = selectedText.style.includes('bold') 
                      ? selectedText.style.filter(s => s !== 'bold')
                      : [...selectedText.style, 'bold']
                    updateTextElement(selectedTextId, { style: styles })
                  }}
                  className={`p-2 rounded ${selectedText.style.includes('bold') ? 'bg-blue-600' : 'bg-gray-600'}`}
                >
                  <Bold size={16} />
                </button>
                <button
                  onClick={() => {
                    const styles = selectedText.style.includes('italic') 
                      ? selectedText.style.filter(s => s !== 'italic')
                      : [...selectedText.style, 'italic']
                    updateTextElement(selectedTextId, { style: styles })
                  }}
                  className={`p-2 rounded ${selectedText.style.includes('italic') ? 'bg-blue-600' : 'bg-gray-600'}`}
                >
                  <Italic size={16} />
                </button>
                <button
                  onClick={() => {
                    const styles = selectedText.style.includes('underline') 
                      ? selectedText.style.filter(s => s !== 'underline')
                      : [...selectedText.style, 'underline']
                    updateTextElement(selectedTextId, { style: styles })
                  }}
                  className={`p-2 rounded ${selectedText.style.includes('underline') ? 'bg-blue-600' : 'bg-gray-600'}`}
                >
                  <Underline size={16} />
                </button>
              </div>
            </div>

            <button
              onClick={() => setShowTextEditor(false)}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 rounded"
            >
              Concluir
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default StoryPhotoEditor
