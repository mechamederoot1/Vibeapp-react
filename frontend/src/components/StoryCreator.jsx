import React, { useRef, useState, useEffect } from 'react'
import { X, Image as ImageIcon, Type, PaintBucket, Plus, Minus, Save } from 'lucide-react'
import { uploadsAPI } from '../services/api'

const STORY_W = 720
const STORY_H = 1280

const defaultText = () => ({
  id: Date.now(),
  text: 'Toque para editar',
  x: STORY_W / 2,
  y: STORY_H / 2,
  fontSize: 36,
  color: '#ffffff',
  bgColor: 'transparent',
  textAlign: 'center'
})

const colorPalette = ['#000000','#ffffff','#ff3b30','#ff9500','#ffcc00','#34c759','#0a84ff','#5856d6']

export default function StoryCreator({ isOpen = false, onClose = () => {}, onStoryCreate = null }) {
  const fileInputRef = useRef(null)
  const canvasRef = useRef(null)
  const open = !!isOpen
  const [stage, setStage] = useState('picker') // picker, editor
  const [imageDataUrl, setImageDataUrl] = useState(null)
  const [textItems, setTextItems] = useState([])
  const [activeTextId, setActiveTextId] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const dragRef = useRef({ id: null, offsetX: 0, offsetY: 0 })
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (open && stage === 'editor') renderCanvas()
  }, [imageDataUrl, textItems, stage])

  const openPicker = () => {
    if (fileInputRef.current) fileInputRef.current.click()
  }

  const closeAll = () => {
    setOpen(false)
    setStage('picker')
    setImageDataUrl(null)
    setTextItems([])
    setActiveTextId(null)
    onClose()
  }

  const handleFileChange = async (e) => {
    const f = e.target.files && e.target.files[0]
    if (!f) return
    const data = await readFileAsDataURL(f)
    const resized = await resizeImageToStory(data)
    setImageDataUrl(resized)
    setStage('editor')
    setTextItems([defaultText()])
  }

  const readFileAsDataURL = (file) => new Promise((res, rej) => {
    const r = new FileReader()
    r.onload = () => res(r.result)
    r.onerror = rej
    r.readAsDataURL(file)
  })

  const resizeImageToStory = (dataUrl) => new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      // Draw to canvas preserving center crop in 9:16
      const targetW = STORY_W
      const targetH = STORY_H
      const tmp = document.createElement('canvas')
      tmp.width = targetW
      tmp.height = targetH
      const ctx = tmp.getContext('2d')

      // compute scale to cover
      const scale = Math.max(targetW / img.width, targetH / img.height)
      const sw = targetW / scale
      const sh = targetH / scale
      const sx = Math.max(0, (img.width - sw) / 2)
      const sy = Math.max(0, (img.height - sh) / 2)

      ctx.fillStyle = '#000'
      ctx.fillRect(0,0,targetW,targetH)
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetW, targetH)
      resolve(tmp.toDataURL('image/jpeg', 0.92))
    }
    img.src = dataUrl
  })

  const renderCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas || !imageDataUrl) return
    canvas.width = STORY_W
    canvas.height = STORY_H
    const ctx = canvas.getContext('2d')
    const bg = new Image()
    bg.onload = () => {
      ctx.clearRect(0,0,STORY_W,STORY_H)
      ctx.drawImage(bg,0,0,STORY_W,STORY_H)

      // draw each text
      textItems.forEach(item => {
        ctx.save()
        ctx.font = `${item.fontSize}px system-ui`
        ctx.textAlign = item.textAlign || 'center'
        ctx.fillStyle = item.color || '#fff'
        // background
        if (item.bgColor && item.bgColor !== 'transparent') {
          const metrics = ctx.measureText(item.text)
          const w = metrics.width + 20
          const h = item.fontSize + 12
          ctx.fillStyle = item.bgColor
          ctx.fillRect(item.x - w/2, item.y - h/2, w, h)
          ctx.fillStyle = item.color || '#fff'
        }
        // text
        const lines = (item.text || '').split('\n')
        for (let i = 0; i < lines.length; i++) {
          ctx.fillText(lines[i], item.x, item.y + (i - (lines.length-1)/2) * (item.fontSize + 6))
        }
        ctx.restore()
      })
    }
    bg.src = imageDataUrl
  }

  // Pointer handlers for dragging text
  const onPointerDownText = (e, id) => {
    e.preventDefault()
    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const item = textItems.find(t => t.id === id)
    if (!item) return
    dragRef.current = { id, offsetX: x - item.x, offsetY: y - item.y }
    setIsDragging(true)
    setActiveTextId(id)
  }

  const onPointerMove = (e) => {
    if (!isDragging) return
    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const { id, offsetX, offsetY } = dragRef.current
    setTextItems(prev => prev.map(t => t.id === id ? { ...t, x: Math.max(20, Math.min(STORY_W-20, x - offsetX)), y: Math.max(20, Math.min(STORY_H-20, y - offsetY)) } : t))
  }

  const onPointerUp = () => {
    if (isDragging) setIsDragging(false)
    dragRef.current = { id: null, offsetX: 0, offsetY: 0 }
  }

  useEffect(() => {
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    return () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
    }
  }, [isDragging])

  const addText = () => {
    const t = defaultText()
    setTextItems(prev => [...prev, t])
    setActiveTextId(t.id)
  }

  const updateActiveText = (patch) => {
    setTextItems(prev => prev.map(t => t.id === activeTextId ? { ...t, ...patch } : t))
  }

  const increaseFont = () => updateActiveText({ fontSize: (textItems.find(t=>t.id===activeTextId)?.fontSize || 24) + 4 })
  const decreaseFont = () => updateActiveText({ fontSize: Math.max(12, (textItems.find(t=>t.id===activeTextId)?.fontSize || 24) - 4) })

  const toggleBg = () => {
    const current = textItems.find(t => t.id === activeTextId)
    if (!current) return
    updateActiveText({ bgColor: current.bgColor === 'transparent' ? '#000000cc' : 'transparent' })
  }

  const setTextColor = (color) => updateActiveText({ color })
  const setTextBgColor = (color) => updateActiveText({ bgColor: color })

  const saveStory = async () => {
    // export canvas (draw final) then upload
    setUploading(true)
    try {
      const canvas = document.createElement('canvas')
      canvas.width = STORY_W
      canvas.height = STORY_H
      const ctx = canvas.getContext('2d')
      const bg = new Image()
      await new Promise((res) => { bg.onload = res; bg.src = imageDataUrl })
      ctx.drawImage(bg,0,0,STORY_W,STORY_H)
      // draw texts (same logic as renderCanvas)
      textItems.forEach(item => {
        ctx.save()
        ctx.font = `${item.fontSize}px system-ui`
        ctx.textAlign = item.textAlign || 'center'
        if (item.bgColor && item.bgColor !== 'transparent') {
          const metrics = ctx.measureText(item.text)
          const w = metrics.width + 20
          const h = item.fontSize + 12
          ctx.fillStyle = item.bgColor
          ctx.fillRect(item.x - w/2, item.y - h/2, w, h)
        }
        ctx.fillStyle = item.color || '#fff'
        const lines = (item.text || '').split('\n')
        for (let i = 0; i < lines.length; i++) {
          ctx.fillText(lines[i], item.x, item.y + (i - (lines.length-1)/2) * (item.fontSize + 6))
        }
        ctx.restore()
      })

      const blob = await new Promise(res => canvas.toBlob(res, 'image/jpeg', 0.92))
      const form = new FormData()
      form.append('file', blob, 'story.jpg')
      // upload via API
      try {
        const resp = await uploadsAPI.uploadStoryMedia(blob)
        console.log('Story uploaded:', resp)
      } catch (e) {
        console.error('Upload failed:', e)
      }

    } catch (e) {
      console.error('Erro ao salvar story:', e)
    } finally {
      setUploading(false)
      closeAll()
    }
  }

  if (!open && !initialOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-60 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-[420px] h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-3 border-b">
          <div className="flex items-center space-x-2">
            <button onClick={closeAll} className="p-2 rounded-full hover:bg-gray-100"><X size={20} /></button>
            <h3 className="font-semibold">Criar Story</h3>
          </div>
          <div className="flex items-center space-x-2">
            <button onClick={openPicker} className="p-2 hover:bg-gray-100 rounded-full"><ImageIcon size={18} /></button>
            <button onClick={addText} className="p-2 hover:bg-gray-100 rounded-full"><Plus size={18} /></button>
            <button onClick={saveStory} className={`p-2 rounded-md bg-vibe-blue text-white ${uploading ? 'opacity-60' : ''}`} disabled={uploading}><Save size={16} /></button>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center bg-black">
          {stage === 'picker' && (
            <div className="text-center p-6">
              <p className="mb-4">Selecione uma imagem para seu story</p>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              <button onClick={openPicker} className="btn-primary">Abrir Galeria</button>
            </div>
          )}

          {stage === 'editor' && (
            <div style={{ width: STORY_W/2, height: STORY_H/2 }} className="relative">
              <canvas ref={canvasRef} style={{ width: '100%', height: '100%', background: '#000' }} />
              {/* interactive overlay for text items (click/drag) */}
              {textItems.map(item => (
                <div
                  key={item.id}
                  onPointerDown={(e) => onPointerDownText(e, item.id)}
                  onDoubleClick={() => setActiveTextId(item.id)}
                  style={{
                    position: 'absolute',
                    left: `${(item.x / STORY_W) * 100}%`,
                    top: `${(item.y / STORY_H) * 100}%`,
                    transform: 'translate(-50%, -50%)',
                    cursor: 'move',
                    pointerEvents: 'auto'
                  }}
                  className="select-none"
                >
                  <div style={{ display: 'inline-block', padding: '6px 8px', background: item.bgColor, borderRadius: 6 }}>
                    <span style={{ color: item.color, fontSize: item.fontSize }}>{item.text}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {stage === 'editor' && (
          <div className="p-3 border-t bg-white">
            <div className="flex items-center justify-between space-x-3">
              <div className="flex items-center space-x-2">
                <button onClick={decreaseFont} className="p-2 bg-gray-100 rounded-full"><Minus size={16} /></button>
                <button onClick={increaseFont} className="p-2 bg-gray-100 rounded-full"><Plus size={16} /></button>
                <button onClick={toggleBg} className="p-2 bg-gray-100 rounded-full"><PaintBucket size={16} /></button>
              </div>

              <div className="flex items-center space-x-2">
                {colorPalette.map(c => (
                  <button key={c} onClick={() => setTextColor(c)} style={{ background: c }} className="w-8 h-8 rounded-full border" />
                ))}
              </div>

              <div className="flex-1 text-right">
                <button onClick={() => setActiveTextId(null)} className="text-sm text-gray-500 mr-2">Desfocar texto</button>
                <button onClick={saveStory} className="btn-primary">Salvar Story</button>
              </div>
            </div>

            {/* Text editor modal */}
            {activeTextId && (
              <div className="mt-3">
                <textarea
                  value={(textItems.find(t=>t.id===activeTextId)?.text) || ''}
                  onChange={(e) => updateActiveText({ text: e.target.value })}
                  className="w-full p-2 border rounded"
                  rows={2}
                />
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">Fundo</span>
                    {colorPalette.map(c => (
                      <button key={c} onClick={() => setTextBgColor(c)} style={{ background: c }} className="w-6 h-6 rounded-full border" />
                    ))}
                  </div>
                  <div>
                    <button onClick={() => setActiveTextId(null)} className="px-3 py-1 rounded bg-gray-100">Concluído</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
