import React, { useRef, useState, useEffect } from 'react'
import { X, Image as ImageIcon, Type, PaintBucket, Plus, Minus, Save, Wind, Pen } from 'lucide-react'
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
  const [imageDataUrl, setImageDataUrl] = useState(null)
  const [textItems, setTextItems] = useState([])
  const [activeTextId, setActiveTextId] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const dragRef = useRef({ id: null, offsetX: 0, offsetY: 0 })
  const [uploading, setUploading] = useState(false)
  const [tool, setTool] = useState('text') // text, draw, none
  const [drawPath, setDrawPath] = useState([])
  const drawCanvasRef = useRef(null)

  // Auto-open native picker when component is opened
  useEffect(() => {
    if (isOpen && !imageDataUrl) {
      setTimeout(() => fileInputRef.current?.click(), 80)
    }
  }, [isOpen, imageDataUrl])

  // Render combined canvas whenever image or text changes
  useEffect(() => {
    renderCanvas()
  }, [imageDataUrl, textItems, drawPath])

  const readFileAsDataURL = (file) => new Promise((res, rej) => {
    const r = new FileReader()
    r.onload = () => res(r.result)
    r.onerror = rej
    r.readAsDataURL(file)
  })

  const resizeImageToStory = (dataUrl) => new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const targetW = STORY_W
      const targetH = STORY_H
      const tmp = document.createElement('canvas')
      tmp.width = targetW
      tmp.height = targetH
      const ctx = tmp.getContext('2d')
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

  const handleFileChange = async (e) => {
    const f = e.target.files && e.target.files[0]
    if (!f) return
    const data = await readFileAsDataURL(f)
    const resized = await resizeImageToStory(data)
    setImageDataUrl(resized)
    setTextItems([defaultText()])
    setTool('text')
  }

  const renderCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas || !imageDataUrl) return
    // draw at device size to keep quality
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    const ctx = canvas.getContext('2d')
    const bg = new Image()
    bg.onload = () => {
      // draw background image stretched to cover full screen but keep aspect
      ctx.clearRect(0,0,canvas.width,canvas.height)
      // compute cover fit
      const imgW = STORY_W
      const imgH = STORY_H
      const scale = Math.max(canvas.width / imgW, canvas.height / imgH)
      const dw = imgW * scale
      const dh = imgH * scale
      const dx = (canvas.width - dw) / 2
      const dy = (canvas.height - dh) / 2
      ctx.drawImage(bg, 0,0,STORY_W,STORY_H, dx, dy, dw, dh)

      // draw drawPath (simple stroke)
      if (drawCanvasRef.current) {
        const dctx = drawCanvasRef.current.getContext('2d')
        dctx.clearRect(0,0,drawCanvasRef.current.width, drawCanvasRef.current.height)
        dctx.lineCap = 'round'
        dctx.lineJoin = 'round'
        dctx.strokeStyle = '#ffffff'
        dctx.lineWidth = 4
        dctx.beginPath()
        for (let i=0;i<drawPath.length;i++) {
          const p = drawPath[i]
          if (!p) continue
          if (i===0) dctx.moveTo(p.x, p.y)
          else dctx.lineTo(p.x, p.y)
        }
        dctx.stroke()
      }

      // draw text items as overlay using scaled coordinates
      textItems.forEach(item => {
        ctx.save()
        // map story coords to screen
        const sx = dx + (item.x / STORY_W) * dw
        const sy = dy + (item.y / STORY_H) * dh
        ctx.font = `${item.fontSize * scale}px system-ui`
        ctx.textAlign = item.textAlign || 'center'
        // background box
        if (item.bgColor && item.bgColor !== 'transparent') {
          const metrics = ctx.measureText(item.text)
          const w = metrics.width + 20
          const h = item.fontSize * scale + 12
          ctx.fillStyle = item.bgColor
          ctx.fillRect(sx - w/2, sy - h/2, w, h)
        }
        ctx.fillStyle = item.color || '#fff'
        const lines = (item.text || '').split('\n')
        for (let i = 0; i < lines.length; i++) {
          ctx.fillText(lines[i], sx, sy + (i - (lines.length-1)/2) * (item.fontSize * scale + 6))
        }
        ctx.restore()
      })
    }
    bg.src = imageDataUrl
  }

  const onPointerDownText = (e, id) => {
    if (tool !== 'text') return
    e.preventDefault()
    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    // map back to story coords
    const imgW = STORY_W
    const imgH = STORY_H
    const scale = Math.max(rect.width / imgW, rect.height / imgH)
    const dw = imgW * scale
    const dh = imgH * scale
    const dx = (rect.width - dw) / 2
    const dy = (rect.height - dh) / 2
    const sx = (x - dx) / dw * imgW
    const sy = (y - dy) / dh * imgH
    const item = textItems.find(t => t.id === id)
    if (!item) return
    dragRef.current = { id, offsetX: sx - item.x, offsetY: sy - item.y }
    setIsDragging(true)
    setActiveTextId(id)
  }

  const onPointerMove = (e) => {
    if (!isDragging) return
    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const imgW = STORY_W
    const imgH = STORY_H
    const scale = Math.max(rect.width / imgW, rect.height / imgH)
    const dw = imgW * scale
    const dh = imgH * scale
    const dx = (rect.width - dw) / 2
    const dy = (rect.height - dh) / 2
    const sx = (x - dx) / dw * imgW
    const sy = (y - dy) / dh * imgH
    const { id, offsetX, offsetY } = dragRef.current
    setTextItems(prev => prev.map(t => t.id === id ? { ...t, x: Math.max(20, Math.min(STORY_W-20, sx - offsetX)), y: Math.max(20, Math.min(STORY_H-20, sy - offsetY)) } : t))
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
    setUploading(true)
    try {
      // final compose at story resolution
      const canvas = document.createElement('canvas')
      canvas.width = STORY_W
      canvas.height = STORY_H
      const ctx = canvas.getContext('2d')
      const bg = new Image()
      await new Promise((res) => { bg.onload = res; bg.src = imageDataUrl })
      ctx.drawImage(bg,0,0,STORY_W,STORY_H)
      // draw drawPath scaled to story (if present)
      if (drawPath && drawPath.length) {
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 4
        ctx.lineJoin = 'round'
        ctx.lineCap = 'round'
        ctx.beginPath()
        for (let i=0;i<drawPath.length;i++) {
          const p = drawPath[i]
          if (i===0) ctx.moveTo(p.x * (STORY_W/window.innerWidth), p.y * (STORY_H/window.innerHeight))
          else ctx.lineTo(p.x * (STORY_W/window.innerWidth), p.y * (STORY_H/window.innerHeight))
        }
        ctx.stroke()
      }
      // draw texts
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
      try {
        const resp = await uploadsAPI.uploadStoryMedia(blob)
        try { onStoryCreate && onStoryCreate(resp.data) } catch(e){}
      } catch (e) {
        console.error('Upload failed:', e)
      }
    } catch (e) {
      console.error('Erro ao salvar story:', e)
    } finally {
      setUploading(false)
      handleClose()
    }
  }

  const handleClose = () => {
    setImageDataUrl(null)
    setTextItems([])
    setActiveTextId(null)
    setDrawPath([])
    onClose()
  }

  // drawing handlers (simple)
  const onDrawStart = (e) => {
    if (tool !== 'draw') return
    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    setDrawPath([{ x, y }])
  }
  const onDrawMove = (e) => {
    if (tool !== 'draw' || !drawPath.length) return
    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    setDrawPath(prev => [...prev, { x, y }])
  }
  const onDrawEnd = () => {}

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-stretch" style={{backgroundColor: 'black'}}>
      {/* full-bleed canvas */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} onPointerDown={(e) => { if (tool==='draw') onDrawStart(e) }} onPointerMove={(e) => { if (tool==='draw') onDrawMove(e) }} onPointerUp={() => onDrawEnd()} />
        {/* drawing overlay canvas (above main) */}
        <canvas ref={drawCanvasRef} style={{ position: 'absolute', top:0,left:0,right:0,bottom:0,width:'100%',height:'100%', pointerEvents: 'none' }} />

        {/* Text interactive overlay (invisible outlines over image) */}
        <div style={{ position: 'absolute', inset: 0 }}>
          {textItems.map(item => {
            // map story coords to screen coords
            const rect = { width: window.innerWidth, height: window.innerHeight }
            const imgW = STORY_W; const imgH = STORY_H
            const scale = Math.max(rect.width / imgW, rect.height / imgH)
            const dw = imgW * scale; const dh = imgH * scale
            const dx = (rect.width - dw) / 2; const dy = (rect.height - dh) / 2
            const left = dx + (item.x / STORY_W) * dw
            const top = dy + (item.y / STORY_H) * dh
            return (
              <div key={item.id}
                onPointerDown={(e) => onPointerDownText(e, item.id)}
                onDoubleClick={() => setActiveTextId(item.id)}
                style={{ position: 'absolute', left, top, transform: 'translate(-50%, -50%)', cursor: 'move' }}>
                <div style={{ padding: 8, borderRadius: 8, border: activeTextId===item.id ? '1px dashed rgba(255,255,255,0.9)' : 'none', background: item.bgColor === 'transparent' ? 'transparent' : item.bgColor }}>
                  <div style={{ color: item.color, fontSize: item.fontSize, whiteSpace: 'pre-wrap', textAlign: 'center' }}>{item.text}</div>
                </div>
              </div>
            )
          })}
        </div>

        {/* hidden file input */}
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

        {/* top bar */}
        <div style={{ position: 'absolute', top: 12, left: 12, right: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', pointerEvents: 'auto' }}>
          <button onClick={handleClose} className="p-2 rounded-full bg-black bg-opacity-40 text-white"><X size={20} /></button>
        </div>
      </div>

      {/* bottom toolbar (transparent outline over image) */}
      <div style={{ display: 'flex', gap: 8, padding: 12, background: 'linear-gradient(180deg, rgba(0,0,0,0), rgba(0,0,0,0.6))' }} className="justify-around">
        <button onClick={() => { setTool('text'); addText() }} className="flex-1 py-3 bg-white/6 text-white rounded-lg flex items-center justify-center space-x-2"> <Type size={18} /> <span>Texto</span> </button>
        <button onClick={() => setTool('draw')} className="flex-1 py-3 bg-white/6 text-white rounded-lg flex items-center justify-center space-x-2"> <Pen size={18} /> <span>Desenhar</span> </button>
        <button onClick={() => setTool('none')} className="flex-1 py-3 bg-white/6 text-white rounded-lg flex items-center justify-center space-x-2"> <ImageIcon size={18} /> <span>Trocar</span> </button>
        <button onClick={saveStory} disabled={uploading} className="flex-1 py-3 bg-vibe-blue text-white rounded-lg flex items-center justify-center space-x-2"> <Save size={18} /> <span>Salvar</span> </button>
      </div>

      {/* text editor drawer */}
      {activeTextId && (
        <div style={{ padding: 12, background: 'rgba(255,255,255,0.04)' }}>
          <textarea value={(textItems.find(t=>t.id===activeTextId)?.text) || ''} onChange={(e) => updateActiveText({ text: e.target.value })} className="w-full p-2 rounded" rows={2} />
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button onClick={decreaseFont} className="px-3 py-2 bg-white/6 text-white rounded">-</button>
            <button onClick={increaseFont} className="px-3 py-2 bg-white/6 text-white rounded">+</button>
            <button onClick={toggleBg} className="px-3 py-2 bg-white/6 text-white rounded">Fundo</button>
            <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
              {colorPalette.map(c => (<button key={c} onClick={() => setTextColor(c)} style={{ width: 28, height: 28, background: c, borderRadius: 999 }} />))}
            </div>
            <button onClick={() => setActiveTextId(null)} className="px-3 py-2 bg-white/6 text-white rounded">Concluído</button>
          </div>
        </div>
      )}
    </div>
  )
}
