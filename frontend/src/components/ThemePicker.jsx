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
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('click', onDoc)
    return () => document.removeEventListener('click', onDoc)
  }, [])

  const select = (id) => {
    setCurrent(id)
    try { localStorage.setItem(`theme:conv:${conversationId}`, id) } catch(e) {}
    setOpen(false)
    if (onChange) onChange(id)
  }

  return (
    <div className="relative" ref={ref}>
      <button onClick={(e) => { e.stopPropagation(); setOpen(o => !o) }} className="p-2 hover:bg-gray-100 rounded-lg">
        <Palette size={18} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 bg-white border border-gray-200 shadow-lg rounded-lg p-3 w-52 z-70">
          <div className="grid grid-cols-5 gap-2">
            {THEMES.map(t => (
              <button key={t.id} onClick={() => select(t.id)} title={t.name} className={`w-10 h-10 rounded-md border ${current === t.id ? 'ring-2 ring-vibe-blue' : 'border-gray-200'}`} style={t.style} />
            ))}
          </div>
          <div className="mt-3 text-xs text-gray-500">Escolha um tema para essa conversa</div>
        </div>
      )}
    </div>
  )
}

export default ThemePicker
