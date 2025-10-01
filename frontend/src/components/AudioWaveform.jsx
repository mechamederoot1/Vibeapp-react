import React, { useEffect, useRef, useState } from 'react'
import { Play, Pause } from 'lucide-react'

export const LiveWaveform = ({ stream, height = 36, color = '#2563eb', bg = '#e5e7eb' }) => {
  const canvasRef = useRef(null)
  const rafRef = useRef(null)
  const audioCtxRef = useRef(null)
  const analyserRef = useRef(null)
  const sourceRef = useRef(null)
  const dataRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !stream) return

    const ctx2d = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1
    const resize = () => {
      const bounds = canvas.getBoundingClientRect()
      canvas.width = Math.floor(bounds.width * dpr)
      canvas.height = Math.floor(height * dpr)
    }
    resize()

    const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    audioCtxRef.current = audioCtx
    const analyser = audioCtx.createAnalyser()
    analyser.fftSize = 1024
    analyserRef.current = analyser

    const source = audioCtx.createMediaStreamSource(stream)
    sourceRef.current = source
    source.connect(analyser)

    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    dataRef.current = dataArray

    const draw = () => {
      analyser.getByteTimeDomainData(dataArray)
      ctx2d.fillStyle = bg
      ctx2d.fillRect(0, 0, canvas.width, canvas.height)

      // bars style to mimic popular chat UIs
      const barWidth = Math.max(2, Math.floor(canvas.width / 120))
      const gap = Math.max(1, Math.floor(barWidth * 0.6))
      const step = Math.max(1, Math.floor(dataArray.length / Math.floor(canvas.width / (barWidth + gap))))
      const centerY = Math.floor(canvas.height / 2)
      ctx2d.fillStyle = color
      let x = 0
      for (let i = 0; i < dataArray.length; i += step) {
        const v = Math.abs(dataArray[i] - 128) / 128
        const h = Math.max(2, Math.floor(v * canvas.height))
        ctx2d.fillRect(x, centerY - h / 2, barWidth, h)
        x += barWidth + gap
      }

      rafRef.current = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      try { source.disconnect() } catch (e) {}
      try { analyser.disconnect() } catch (e) {}
      try { audioCtx.close() } catch (e) {}
    }
  }, [stream, height, color, bg])

  return (
    <div className="w-full" style={{ height }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: `${height}px`, display: 'block', borderRadius: 8 }} />
    </div>
  )
}

export const PlaybackWaveform = ({ src, peaks, height = 36, color = '#2563eb', bg = '#e5e7eb' }) => {
  const canvasRef = useRef(null)
  const audioRef = useRef(null)
  const rafRef = useRef(null)
  const audioCtxRef = useRef(null)
  const analyserRef = useRef(null)
  const sourceRef = useRef(null)
  const dataRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  const fmt = (t) => {
    const s = Math.max(0, Math.floor(t))
    const m = String(Math.floor(s / 60)).padStart(1, '0')
    const r = String(s % 60).padStart(2, '0')
    return `${m}:${r}`
  }

  useEffect(() => {
    const canvas = canvasRef.current
    const audio = audioRef.current
    if (!canvas || !audio) return

    const ctx2d = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1
    const resize = () => {
      const bounds = canvas.getBoundingClientRect()
      canvas.width = Math.floor(bounds.width * dpr)
      canvas.height = Math.floor(height * dpr)
    }
    resize()

    let audioCtx
    let analyser
    let source
    let dataArray

    const setup = () => {
      if (peaks && peaks.length) return // no need for analyser when using precomputed peaks
      if (audioCtxRef.current) return
      audioCtx = new (window.AudioContext || window.webkitAudioContext)()
      audioCtxRef.current = audioCtx
      analyser = audioCtx.createAnalyser()
      analyser.fftSize = 1024
      analyserRef.current = analyser
      source = audioCtx.createMediaElementSource(audio)
      sourceRef.current = source
      source.connect(analyser)
      analyser.connect(audioCtx.destination)
      dataArray = new Uint8Array(analyser.frequencyBinCount)
      dataRef.current = dataArray
    }

    const drawBarsFromPeaks = () => {
      ctx2d.fillStyle = bg
      ctx2d.fillRect(0, 0, canvas.width, canvas.height)
      const centerY = Math.floor(canvas.height / 2)
      const n = Math.max(1, peaks?.length || 0)
      const barWidth = Math.max(2, Math.floor(canvas.width / Math.min(120, n)))
      const gap = Math.max(1, Math.floor(barWidth * 0.6))
      const totalBars = Math.floor(canvas.width / (barWidth + gap))
      for (let i = 0; i < totalBars; i++) {
        const idx = Math.floor((i / totalBars) * n)
        const v = Math.min(1, Math.max(0, peaks[idx] || 0))
        const h = Math.max(2, Math.floor(v * canvas.height))
        ctx2d.fillStyle = color
        ctx2d.fillRect(i * (barWidth + gap), centerY - h / 2, barWidth, h)
      }
    }

    const drawAnalyser = () => {
      if (!analyserRef.current || !dataRef.current) return
      analyserRef.current.getByteTimeDomainData(dataRef.current)
      ctx2d.fillStyle = bg
      ctx2d.fillRect(0, 0, canvas.width, canvas.height)

      const barWidth = Math.max(2, Math.floor(canvas.width / 120))
      const gap = Math.max(1, Math.floor(barWidth * 0.6))
      const step = Math.max(1, Math.floor(dataRef.current.length / Math.floor(canvas.width / (barWidth + gap))))
      const centerY = Math.floor(canvas.height / 2)
      ctx2d.fillStyle = color
      let x = 0
      for (let i = 0; i < dataRef.current.length; i += step) {
        const v = Math.abs(dataRef.current[i] - 128) / 128
        const h = Math.max(2, Math.floor(v * canvas.height))
        ctx2d.fillRect(x, centerY - h / 2, barWidth, h)
        x += barWidth + gap
      }
    }

    const draw = () => {
      if (peaks && peaks.length) drawBarsFromPeaks(); else drawAnalyser()

      const a = audioRef.current
      if (a && a.duration > 0) {
        const p = Math.min(1, Math.max(0, a.currentTime / a.duration))
        const xPos = p * canvas.width
        ctx2d.strokeStyle = color
        ctx2d.lineWidth = 1 * dpr
        ctx2d.beginPath()
        ctx2d.moveTo(xPos, 0)
        ctx2d.lineTo(xPos, canvas.height)
        ctx2d.stroke()
      }

      rafRef.current = requestAnimationFrame(draw)
    }

    const onPlay = async () => {
      setup()
      try { await audioCtxRef.current?.resume?.() } catch (e) {}
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      setIsPlaying(true)
      draw()
    }

    const onPause = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      setIsPlaying(false)
      // draw once to render final progress position
      draw()
    }

    const onTime = () => setCurrentTime(audio.currentTime || 0)
    const onLoaded = () => setDuration(audio.duration || 0)

    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('ended', onPause)
    audio.addEventListener('timeupdate', onTime)
    audio.addEventListener('loadedmetadata', onLoaded)

    // initial paint
    draw()

    return () => {
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('ended', onPause)
      audio.removeEventListener('timeupdate', onTime)
      audio.removeEventListener('loadedmetadata', onLoaded)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      try { sourceRef.current && sourceRef.current.disconnect() } catch (e) {}
      try { analyserRef.current && analyserRef.current.disconnect() } catch (e) {}
      try { audioCtxRef.current && audioCtxRef.current.close() } catch (e) {}
    }
  }, [src, peaks, height, color, bg])

  const progress = duration > 0 ? Math.min(1, Math.max(0, currentTime / duration)) : 0

  const iconColor = (typeof color === 'string' && color.toLowerCase() === '#ffffff') || color === 'white' ? '#2563eb' : '#ffffff'
  const timeColor = (typeof color === 'string' && color.toLowerCase() === '#ffffff') || color === 'white' ? 'rgba(255,255,255,0.85)' : 'rgba(55,65,81,0.8)'

  return (
    <div className="w-full flex items-center gap-3">
      <audio ref={audioRef} src={src} preload="metadata" />
      <button
        onClick={() => {
          const a = audioRef.current
          if (!a) return
          if (a.paused) a.play(); else a.pause()
        }}
        className="w-10 h-10 rounded-full flex items-center justify-center shadow-sm"
        style={{ backgroundColor: color, color: iconColor }}
        aria-label="Reproduzir/Pausar áudio"
      >
        {isPlaying ? <Pause size={18} /> : <Play size={18} />}
      </button>

      <div className="flex-1 relative select-none" style={{ height }}
        onClick={(e) => {
          const a = audioRef.current
          const canvas = canvasRef.current
          if (!a || !canvas || !duration) return
          const rect = canvas.getBoundingClientRect()
          const x = e.clientX - rect.left
          const p = Math.min(1, Math.max(0, x / rect.width))
          a.currentTime = p * duration
        }}
      >
        <canvas ref={canvasRef} style={{ width: '100%', height: `${height}px`, display: 'block', borderRadius: 8 }} />
        <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border border-white/70" style={{ left: `calc(${progress * 100}% - 6px)`, backgroundColor: color }} />
        <div className="absolute -bottom-4 left-0 text-[10px] tabular-nums" style={{ color: timeColor }}>{fmt(currentTime)}</div>
        <div className="absolute -bottom-4 right-0 text-[10px] tabular-nums" style={{ color: timeColor }}>{fmt(duration)}</div>
      </div>
    </div>
  )
}

export default PlaybackWaveform
