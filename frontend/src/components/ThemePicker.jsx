import React, { useState, useEffect, useRef } from 'react'
import React, { useState, useEffect, useRef } from 'react'
import { Palette } from 'lucide-react'

const THEMES = [
  { id: 'classic', name: 'Classic', style: { background: 'linear-gradient(180deg,#fff,#f7f7fb)' } },
  { id: 'midnight', name: 'Midnight', style: { background: `linear-gradient(180deg,#0f172a,#0b1220)` , color: '#fff' } },
  { id: 'ocean', name: 'Ocean', style: { background: 'linear-gradient(180deg,#e0f2fe,#bae6fd)' } },
  { id: 'sunset', name: 'Sunset', style: { background: 'linear-gradient(180deg,#ffecd2,#fcb69f)' } },
  { id: 'mint', name: 'Mint', style: { background: 'linear-gradient(180deg,#ecfeff,#bbf7d0)' } },
]

const ThemePicker = ({ conversationId, onChange }) => {
  const [open, setOpen] = useState(false)
  const [current, setCurrent] = useState(null)
  const ref = useRef(null)

  useEffect(() => {
    if (!conversationId) return
    try {
      const saved = localStorage.getItem(`theme:conv:${conversationId}`)
      if (saved) setCurrent(saved)
    } catch(e) {}
  }, [conversationId])

  useEffect(() => {
    const onDoc = (e) => {
      try {
        if (ref.current && !ref.current.contains(e.target)) setOpen(false)
      } catch(e) {}
    }
    // Use pointerdown to handle touch/mouse consistently
    document.addEventListener('pointerdown', onDoc)
    return () => document.removeEventListener('pointerdown', onDoc)
  }, [])

  const select = (id) => {
    setCurrent(id)
    try { localStorage.setItem(`theme:conv:${conversationId}`, id) } catch(e) {}
    setOpen(false)
    if (onChange) onChange(id)
  }

  const fileInputRef = useRef(null)

  const openGallery = (e) => {
    e.stopPropagation()
    try {
      fileInputRef.current && fileInputRef.current.click()
    } catch(e) {}
  }

  const onFileChange = (e) => {
    const f = e.target.files && e.target.files[0]
    if (!f) return
    const reader = new FileReader()
    reader.onload = () => {
      const data = reader.result
      // store data URL as theme value
      select(data)
    }
    reader.readAsDataURL(f)
  }

  return (
    <div className="relative" ref={ref}>
      <button onPointerDown={(e) => { e.stopPropagation(); setOpen(o => !o) }} onClick={(e)=>e.stopPropagation()} className="p-2 hover:bg-gray-100 rounded-lg">
        <Palette size={18} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 bg-white border border-gray-200 shadow-lg rounded-lg p-3 w-56 z-70">
          <div className="grid grid-cols-5 gap-2">
            {THEMES.map(t => (
              <button key={t.id} onClick={(ev) => { ev.stopPropagation(); select(t.id) }} title={t.name} className={`w-10 h-10 rounded-md border ${current === t.id ? 'ring-2 ring-vibe-blue' : 'border-gray-200'}`} style={t.style} />
            ))}
          </div>

          <div className="mt-3 border-t pt-2">
            <button onClick={openGallery} className="w-full text-sm text-left px-2 py-2 rounded-md hover:bg-gray-50 flex items-center space-x-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V7" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 3v4M8 3v4m-6 4h20" /></svg>
              <span>Galeria</span>
            </button>
            <div className="mt-2 text-xs text-gray-500">Escolha um tema ou use uma foto da galeria</div>
          </div>

          <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onFileChange} />
        </div>
      )}
    </div>
  )
}

export default ThemePicker
