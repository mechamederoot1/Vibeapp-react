import React, { useRef, useState, useEffect } from 'react'
import { X, Type, Pen, Image as ImageIcon, Save, Plus, Minus } from 'lucide-react'
import { uploadsAPI, storiesAPI } from '../services/api'

const STORY_W = 720
const STORY_H = 1280
const PALETTE = ['#ffffff','#000000','#ff3b30','#ff9500','#ffcc00','#34c759','#0a84ff','#5856d6']

const defaultText = () => ({
  id: Date.now(),
  text: 'Toque para editar',
  x: STORY_W/2,
  y: STORY_H/2,
  fontSize: 36,
  color: '#ffffff',
  bg: 'transparent',
  scale: 1
})

export default function StoryEditor({ isOpen=false, onClose=()=>{}, onStoryCreate=null }){
  const fileRef = useRef(null)
  const bgCanvasRef = useRef(null)
  const drawCanvasRef = useRef(null)
  const [imageData, setImageData] = useState(null)
  const [texts, setTexts] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [mode, setMode] = useState('text') // text | draw | none
  const [drawing, setDrawing] = useState(false)
  const [path, setPath] = useState([])
  const [uploading, setUploading] = useState(false)

  // open picker automatically when opened
  useEffect(()=>{
    if(isOpen && !imageData){
      setTimeout(()=>fileRef.current?.click(), 80)
    }
  },[isOpen,imageData])

  useEffect(()=>{
    renderPreview()
  },[imageData,texts,path])

  const readFile = (file)=> new Promise((res,rej)=>{
    const r = new FileReader(); r.onload=()=>res(r.result); r.onerror=rej; r.readAsDataURL(file)
  })

  const resizeToStory = (dataUrl) => new Promise((res)=>{
    const img = new Image(); img.onload = ()=>{
      const c = document.createElement('canvas'); c.width=STORY_W; c.height=STORY_H; const ctx = c.getContext('2d')
      const scale = Math.max(STORY_W/img.width, STORY_H/img.height)
      const sw = STORY_W/scale, sh = STORY_H/scale
      const sx = Math.max(0,(img.width-sw)/2), sy = Math.max(0,(img.height-sh)/2)
      ctx.fillStyle='#000'; ctx.fillRect(0,0,STORY_W,STORY_H)
      ctx.drawImage(img,sx,sy,sw,sh,0,0,STORY_W,STORY_H)
      res(c.toDataURL('image/jpeg',0.92))
    }
    img.src=dataUrl
  })

  const onFile = async (e)=>{
    const f = e.target.files?.[0]; if(!f) return
    const data = await readFile(f)
    const resized = await resizeToStory(data)
    setImageData(resized)
    setTexts([defaultText()])
    setMode('text')
  }

  const renderPreview = ()=>{
    const bgC = bgCanvasRef.current
    if(!bgC || !imageData) return
    const ctx = bgC.getContext('2d')
    // draw at element size
    const w = bgC.clientWidth, h = bgC.clientHeight
    bgC.width = w; bgC.height = h
    const img = new Image(); img.onload=()=>{
      // cover fit
      const scale = Math.max(w/STORY_W, h/STORY_H)
      const dw = STORY_W*scale, dh = STORY_H*scale
      const dx = (w-dw)/2, dy=(h-dh)/2
      ctx.clearRect(0,0,w,h);
      ctx.drawImage(img, 0,0,STORY_W,STORY_H, dx, dy, dw, dh)
      // texts
      texts.forEach(t=>{
        ctx.save(); ctx.fillStyle = t.bg!=='transparent'?t.bg:'rgba(0,0,0,0)'
        const sx = dx + (t.x/STORY_W)*dw
        const sy = dy + (t.y/STORY_H)*dh
        ctx.font = `${t.fontSize* (dw/STORY_W) }px system-ui`
        if(t.bg!=='transparent'){
          const m = ctx.measureText(t.text); const W = m.width + 20; const H = t.fontSize*(dw/STORY_W)+12
          ctx.fillStyle = t.bg; ctx.fillRect(sx-W/2, sy-H/2, W, H)
        }
        ctx.fillStyle = t.color; ctx.textAlign='center'
        const lines = (t.text||'').split('\n')
        lines.forEach((ln,i)=> ctx.fillText(ln, sx, sy + (i - (lines.length-1)/2)*(t.fontSize*(dw/STORY_W)+6)))
        ctx.restore()
      })
    }
    img.src = imageData

    // draw drawing path on overlay
    const drawC = drawCanvasRef.current
    if(drawC){ drawC.width=bgC.width; drawC.height=bgC.height; const dctx = drawC.getContext('2d'); dctx.clearRect(0,0,drawC.width,drawC.height); dctx.strokeStyle='#fff'; dctx.lineWidth=4; dctx.lineJoin='round'; dctx.lineCap='round'; dctx.beginPath(); path.forEach((p,i)=>{ const px=p.x*drawC.width; const py=p.y*drawC.height; if(i===0) dctx.moveTo(px,py); else dctx.lineTo(px,py) }); dctx.stroke() }
  }

  // pointer handlers for drawing
  const onDrawStart = (e)=>{
    if(mode!=='draw') return
    const rect = drawCanvasRef.current.getBoundingClientRect()
    const x=(e.clientX-rect.left)/rect.width, y=(e.clientY-rect.top)/rect.height
    setPath([{x,y}]); setDrawing(true)
  }
  const onDrawMove = (e)=>{ if(!drawing) return; const rect = drawCanvasRef.current.getBoundingClientRect(); const x=(e.clientX-rect.left)/rect.width, y=(e.clientY-rect.top)/rect.height; setPath(prev=>[...prev,{x,y}]) }
  const onDrawEnd = ()=>{ setDrawing(false) }

  // text drag
  const onTextDown = (e,id)=>{
    if(mode!=='text') return; e.stopPropagation(); const rect = bgCanvasRef.current.getBoundingClientRect(); const x=e.clientX-rect.left; const y=e.clientY-rect.top; const w=rect.width,h=rect.height; const px = (x)/w; const py=(y)/h; // map to story coords
    // compute story coords
    const sx = px*STORY_W; const sy = py*STORY_H
    const t = texts.find(t=>t.id===id); if(!t) return; dragRef.current={id,offsetX:sx-t.x,offsetY:sy-t.y}; setActiveId(id); window.addEventListener('pointermove', onTextMove); window.addEventListener('pointerup', onTextUp)
  }
  const onTextMove = (e)=>{
    const rect = bgCanvasRef.current.getBoundingClientRect(); const x=e.clientX-rect.left; const y=e.clientY-rect.top; const w=rect.width,h=rect.height; const sx = (x/w)*STORY_W; const sy=(y/h)*STORY_H; const {id,offsetX,offsetY} = dragRef.current||{}; if(!id) return; setTexts(prev=>prev.map(t=> t.id===id?{...t,x:Math.max(20,Math.min(STORY_W-20,sx-offsetX)),y:Math.max(20,Math.min(STORY_H-20,sy-offsetY))}:t)) }
  const onTextUp = ()=>{ dragRef.current={}; window.removeEventListener('pointermove', onTextMove); window.removeEventListener('pointerup', onTextUp) }

  const addText = ()=>{ const t=defaultText(); setTexts(prev=>[...prev,t]); setActiveId(t.id) }
  const updateText = (patch)=> setTexts(prev=>prev.map(t=> t.id===activeId?{...t,...patch}:t))
  const incFont = ()=> updateText({fontSize:(texts.find(t=>t.id===activeId)?.fontSize||36)+4})
  const decFont = ()=> updateText({fontSize:Math.max(12,(texts.find(t=>t.id===activeId)?.fontSize||36)-4)})
  const toggleBg = ()=>{ const cur=texts.find(t=>t.id===activeId); if(!cur) return; updateText({bg: cur.bg==='transparent'?'rgba(0,0,0,0.6)':'transparent'}) }
  const setColor = (c)=> updateText({color:c})

  const save = async ()=>{
    if(!imageData) return
    setUploading(true)
    try{
      const canvas = document.createElement('canvas'); canvas.width=STORY_W; canvas.height=STORY_H; const ctx = canvas.getContext('2d'); const img = new Image(); await new Promise(r=>{img.onload=r; img.src=imageData}); ctx.drawImage(img,0,0,STORY_W,STORY_H)
      // draw path scaled
      if(path&&path.length){ ctx.strokeStyle='#fff'; ctx.lineWidth=4; ctx.beginPath(); path.forEach((p,i)=>{ const px = p.x*STORY_W, py = p.y*STORY_H; if(i===0) ctx.moveTo(px,py); else ctx.lineTo(px,py) }); ctx.stroke() }
      texts.forEach(t=>{ ctx.save(); ctx.font = `${t.fontSize}px system-ui`; ctx.textAlign='center'; if(t.bg!=='transparent'){ const metrics = ctx.measureText(t.text); const W = metrics.width + 20; const H = t.fontSize + 12; ctx.fillStyle = t.bg; ctx.fillRect(t.x - W/2, t.y - H/2, W, H) } ctx.fillStyle = t.color; const lines=(t.text||'').split('\n'); lines.forEach((ln,i)=> ctx.fillText(ln, t.x, t.y + (i - (lines.length-1)/2)*(t.fontSize+6))); ctx.restore() })
      const blob = await new Promise(res=>canvas.toBlob(res,'image/jpeg',0.92))
      const resp = await uploadsAPI.uploadStoryMedia(blob)
      try{ await storiesAPI.createStory({ type: 'image', mediaUrl: resp.data.url, content: texts.map(t=>t.text).join('\n'), privacy: 'public', duration: 24 }) }catch(e){console.error(e)}
      try{ onStoryCreate && onStoryCreate(resp.data) }catch(e){}
    }catch(e){ console.error(e) }
    setUploading(false); handleClose()
  }

  const handleClose = ()=>{ setImageData(null); setTexts([]); setPath([]); setActiveId(null); onClose() }

  return isOpen? (
    <div style={{position:'fixed',inset:0,zIndex:60,background:'black'}}>
      <div style={{position:'absolute',inset:0}} onPointerDown={(e)=>{ if(mode==='draw') onDrawStart(e) }} onPointerMove={(e)=>{ if(mode==='draw') onDrawMove(e) }} onPointerUp={()=>{ if(mode==='draw') onDrawEnd() }}>
        <canvas ref={bgCanvasRef} style={{width:'100%',height:'100%',display:'block'}} />
        <canvas ref={drawCanvasRef} style={{position:'absolute',inset:0,pointerEvents:'none',width:'100%',height:'100%'}} />
        {/* interactive text overlays */}
        <div style={{position:'absolute',inset:0,pointerEvents:'auto'}}>
          {texts.map(t=>{
            const rect = bgCanvasRef.current?.getBoundingClientRect()||{width:window.innerWidth,height:window.innerHeight}
            const scale = Math.max(rect.width/STORY_W, rect.height/STORY_H)
            const dw = STORY_W*scale, dh = STORY_H*scale, dx=(rect.width-dw)/2, dy=(rect.height-dh)/2
            const left = dx + (t.x/STORY_W)*dw, top = dy + (t.y/STORY_H)*dh
            return (
              <div key={t.id} onPointerDown={(e)=>onTextDown(e,t.id)} style={{position:'absolute',left,top,transform:'translate(-50%,-50%)',cursor:'move'}}>
                <div style={{padding:8,borderRadius:8, border: activeId===t.id ? '1px dashed rgba(255,255,255,0.9)':'none', background: t.bg}}>
                  <div style={{color:t.color,fontSize:t.fontSize,whiteSpace:'pre-wrap',textAlign:'center'}}>{t.text}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* top bar */}
      <div style={{position:'absolute',top:12,left:12,right:12,display:'flex',justifyContent:'space-between',pointerEvents:'auto'}}>
        <button onClick={handleClose} style={{background:'rgba(0,0,0,0.4)',borderRadius:999,padding:8,color:'#fff'}}> <X/> </button>
      </div>

      {/* bottom toolbar */}
      <div style={{position:'absolute',left:12,right:12,bottom:16,display:'flex',gap:8,justifyContent:'space-between',pointerEvents:'auto'}}>
        <button onClick={()=>{ setMode('text'); addText() }} style={{flex:1,padding:12,background:'rgba(255,255,255,0.08)',color:'#fff',borderRadius:12}}> <Type/> Texto</button>
        <button onClick={()=>{ setMode('draw') }} style={{flex:1,padding:12,background:'rgba(255,255,255,0.08)',color:'#fff',borderRadius:12}}> <Pen/> Desenhar</button>
        <button onClick={()=>fileRef.current?.click()} style={{flex:1,padding:12,background:'rgba(255,255,255,0.08)',color:'#fff',borderRadius:12}}> <ImageIcon/> Trocar</button>
        <button onClick={save} disabled={uploading} style={{flex:1,padding:12,background:'#1877f2',color:'#fff',borderRadius:12}}> <Save/> Salvar</button>
      </div>

      {/* editor drawer */}
      {activeId && (
        <div style={{position:'absolute',left:12,right:12,bottom:84,background:'rgba(0,0,0,0.5)',padding:10,borderRadius:10,color:'#fff'}}>
          <textarea value={(texts.find(t=>t.id===activeId)?.text)||''} onChange={(e)=>updateText({text:e.target.value})} style={{width:'100%',padding:8,borderRadius:8}} rows={2} />
          <div style={{display:'flex',gap:8,marginTop:8,alignItems:'center'}}>
            <button onClick={decFont} style={{padding:8}}> <Minus/> </button>
            <button onClick={incFont} style={{padding:8}}> <Plus/> </button>
            <button onClick={toggleBg} style={{padding:8}}> Fundo </button>
            <div style={{marginLeft:'auto',display:'flex',gap:6}}>
              {PALETTE.map(c=> (<button key={c} onClick={()=>setColor(c)} style={{width:26,height:26,background:c,borderRadius:999}}/>))}
            </div>
            <button onClick={()=>setActiveId(null)} style={{padding:8}}> Concluído </button>
          </div>
        </div>
      )}

      <input ref={fileRef} type="file" accept="image/*" style={{display:'none'}} onChange={onFile} />
    </div>
  ) : null
}
