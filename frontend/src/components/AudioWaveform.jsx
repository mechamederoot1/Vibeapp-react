import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Play, Pause } from 'lucide-react'

const clamp = (value, min, max) => Math.min(Math.max(value, min), max)

const normalizeHex = (value) => {
  if (typeof value !== 'string') return null
  let hex = value.trim()
  if (hex.startsWith('#')) hex = hex.slice(1)
  if (hex.length === 3) {
    hex = hex.split('').map((ch) => ch + ch).join('')
  }
  if (/^[0-9a-fA-F]{6}$/.test(hex)) {
    return hex.toLowerCase()
  }
  return null
}

const parseHexColor = (value) => {
  const normalized = normalizeHex(value)
  if (!normalized) return null
  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16)
  }
}

const toHex = (component) => component.toString(16).padStart(2, '0')

const adjustColor = (value, amount = 0) => {
  const parsed = parseHexColor(value)
  if (!parsed) return value
  const ratio = clamp(Math.abs(amount), 0, 1)
  const target = amount >= 0 ? 255 : 0
  const r = Math.round(parsed.r + (target - parsed.r) * ratio)
  const g = Math.round(parsed.g + (target - parsed.g) * ratio)
  const b = Math.round(parsed.b + (target - parsed.b) * ratio)
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

const withAlpha = (value, alpha = 1) => {
  const parsed = parseHexColor(value)
  if (!parsed) return null
  const a = clamp(alpha, 0, 1)
  return `rgba(${parsed.r}, ${parsed.g}, ${parsed.b}, ${a})`
}

const isLightTone = (value) => {
  if (!value) return false
  const lower = typeof value === 'string' ? value.toLowerCase() : ''
  if (lower === 'white' || lower === '#fff' || lower === '#ffffff') return true
  const parsed = parseHexColor(value)
  if (!parsed) return false
  const luminance = (0.299 * parsed.r + 0.587 * parsed.g + 0.114 * parsed.b) / 255
  return luminance >= 0.72
}

const createBarGradient = (ctx, color, height) => {
  if (!ctx || !color) return color
  const top = adjustColor(color, 0.35)
  const bottom = adjustColor(color, -0.2)
  const gradient = ctx.createLinearGradient(0, 0, 0, height)
  gradient.addColorStop(0, top)
  gradient.addColorStop(1, bottom)
  return gradient
}

const drawRoundedBar = (ctx, x, y, width, height) => {
  if (width <= 0 || height <= 0) return
  const radius = Math.min(width, height) / 2
  if (ctx.roundRect) {
    ctx.beginPath()
    ctx.roundRect(x, y, width, height, radius)
    ctx.fill()
    return
  }
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.lineTo(x + width - radius, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
  ctx.lineTo(x + width, y + height - radius)
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
  ctx.lineTo(x + radius, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
  ctx.lineTo(x, y + radius)
  ctx.quadraticCurveTo(x, y, x + radius, y)
  ctx.closePath()
  ctx.fill()
}

export const LiveWaveform = ({ stream, height = 36, color = '#2563eb', bg = '#e5e7eb' }) => {
  const canvasRef = useRef(null)
  const rafRef = useRef(null)
  const audioCtxRef = useRef(null)
  const analyserRef = useRef(null)
  const sourceRef = useRef(null)
  const dataRef = useRef(null)

  const waveformHeight = useMemo(() => Math.max(24, height), [height])
  const lightTone = useMemo(() => isLightTone(color), [color])
  const resolvedBg = useMemo(() => {
    if (bg && bg !== 'transparent') return bg
    return withAlpha(color, lightTone ? 0.22 : 0.14) || 'rgba(148,163,184,0.12)'
  }, [bg, color, lightTone])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !stream) return

    const ctx2d = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1
    const resize = () => {
      const bounds = canvas.getBoundingClientRect()
      canvas.width = Math.floor(bounds.width * dpr)
      canvas.height = Math.floor(waveformHeight * dpr)
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
      if (resolvedBg && resolvedBg !== 'transparent') {
        ctx2d.fillStyle = resolvedBg
        ctx2d.fillRect(0, 0, canvas.width, canvas.height)
      } else {
        ctx2d.clearRect(0, 0, canvas.width, canvas.height)
      }

      const barWidth = Math.max(2 * dpr, Math.floor(canvas.width / 140))
      const gap = Math.max(1 * dpr, Math.floor(barWidth * 0.45))
      const totalBars = Math.floor(canvas.width / (barWidth + gap))
      const step = Math.max(1, Math.floor(dataArray.length / totalBars))
      const centerY = Math.floor(canvas.height / 2)

      ctx2d.save()
      ctx2d.fillStyle = createBarGradient(ctx2d, color, canvas.height)
      ctx2d.shadowColor = withAlpha(color, 0.35) || 'rgba(37,99,235,0.35)'
      ctx2d.shadowBlur = 12 * dpr

      let x = 0
      for (let i = 0; i < dataArray.length; i += step) {
        const v = Math.abs(dataArray[i] - 128) / 128
        const h = Math.max(3 * dpr, Math.floor(v * canvas.height))
        drawRoundedBar(ctx2d, x, centerY - h / 2, barWidth, h)
        x += barWidth + gap
      }
      ctx2d.restore()

      rafRef.current = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      try { source.disconnect() } catch (e) {}
      try { analyser.disconnect() } catch (e) {}
      try { audioCtx.close() } catch (e) {}
    }
  }, [stream, waveformHeight, color, resolvedBg])

  return (
    <div className="w-full overflow-hidden rounded-2xl" style={{ height: waveformHeight }}>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: `${waveformHeight}px`, display: 'block' }}
      />
    </div>
  )
}

export const PlaybackWaveform = ({ src, peaks, height = 28, color = '#2563eb', bg = '#e5e7eb', variant = 'default', playBg }) => {
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
  const [computedPeaks, setComputedPeaks] = useState(null)

  const waveformHeight = useMemo(() => Math.max(24, height), [height])
  const lightTone = useMemo(() => isLightTone(color), [color])
  const resolvedBg = useMemo(() => {
    if (bg && bg !== 'transparent') return bg
    return withAlpha(color, lightTone ? 0.26 : 0.12) || 'rgba(148,163,184,0.12)'
  }, [bg, color, lightTone])

  const fmt = (t) => {
    const s = Math.max(0, Math.floor(t))
    const m = String(Math.floor(s / 60)).padStart(1, '0')
    const r = String(s % 60).padStart(2, '0')
    return `${m}:${r}`
  }

  useEffect(() => {
    let cancelled = false
    const doCompute = async () => {
      if (peaks && peaks.length) { setComputedPeaks(null); return }
      try {
        const res = await fetch(src)
        const buf = await res.arrayBuffer()
        const ctx = new (window.AudioContext || window.webkitAudioContext)()
        const audioBuf = await ctx.decodeAudioData(buf)
        const channel = audioBuf.getChannelData(0)
        const bars = 120
        const blockSize = Math.max(1, Math.floor(channel.length / bars))
        const peakArr = new Array(bars).fill(0)
        for (let i = 0; i < bars; i++) {
          const start = i * blockSize
          let sum = 0
          for (let j = 0; j < blockSize && start + j < channel.length; j++) {
            sum += Math.abs(channel[start + j])
          }
          peakArr[i] = Math.min(1, (sum / blockSize) * 2.2)
        }
        if (!cancelled) setComputedPeaks(peakArr)
        try { ctx.close() } catch (e) {}
      } catch (e) {
        if (!cancelled) {
          const n = 72
          const arr = Array.from({ length: n }, (_, i) => (Math.sin(i / 3.6) + 1) / 2)
          setComputedPeaks(arr)
        }
      }
    }
    if (src) doCompute()
    return () => { cancelled = true }
  }, [src, peaks])

  useEffect(() => {
    const canvas = canvasRef.current
    const audio = audioRef.current
    if (!canvas || !audio) return

    const ctx2d = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1
    const resize = () => {
      const bounds = canvas.getBoundingClientRect()
      canvas.width = Math.floor(bounds.width * dpr)
      canvas.height = Math.floor(waveformHeight * dpr)
    }
    resize()

    let audioCtx
    let analyser
    let source
    let dataArray

    const setup = () => {
      if ((peaks && peaks.length) || (computedPeaks && computedPeaks.length)) return
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

    const drawBarsFromPeaks = (usePeaks) => {
      if (resolvedBg && resolvedBg !== 'transparent') {
        ctx2d.fillStyle = resolvedBg
        ctx2d.fillRect(0, 0, canvas.width, canvas.height)
      } else {
        ctx2d.clearRect(0, 0, canvas.width, canvas.height)
      }
      const centerY = Math.floor(canvas.height / 2)
      const n = Math.max(1, usePeaks?.length || 0)
      const barWidth = Math.max(3 * dpr, Math.floor(canvas.width / Math.min(140, n)))
      const gap = Math.max(2 * dpr, Math.floor(barWidth * 0.55))
      const totalBars = Math.floor(canvas.width / (barWidth + gap))

      ctx2d.save()
      ctx2d.fillStyle = createBarGradient(ctx2d, color, canvas.height)
      ctx2d.shadowColor = withAlpha(color, 0.3) || 'rgba(37,99,235,0.3)'
      ctx2d.shadowBlur = 10 * dpr

      for (let i = 0; i < totalBars; i++) {
        const idx = Math.floor((i / totalBars) * n)
        const v = Math.min(1, Math.max(0, usePeaks[idx] || 0))
        const h = Math.max(6 * dpr, Math.floor(v * canvas.height))
        const x = i * (barWidth + gap)
        drawRoundedBar(ctx2d, x, centerY - h / 2, barWidth, h)
      }
      ctx2d.restore()
    }

    const drawAnalyser = () => {
      if (!analyserRef.current || !dataRef.current) return
      analyserRef.current.getByteTimeDomainData(dataRef.current)
      if (resolvedBg && resolvedBg !== 'transparent') {
        ctx2d.fillStyle = resolvedBg
        ctx2d.fillRect(0, 0, canvas.width, canvas.height)
      } else {
        ctx2d.clearRect(0, 0, canvas.width, canvas.height)
      }

      const barWidth = Math.max(3 * dpr, Math.floor(canvas.width / 120))
      const gap = Math.max(2 * dpr, Math.floor(barWidth * 0.55))
      const totalBars = Math.floor(canvas.width / (barWidth + gap))
      const step = Math.max(1, Math.floor(dataRef.current.length / totalBars))
      const centerY = Math.floor(canvas.height / 2)

      ctx2d.save()
      ctx2d.fillStyle = createBarGradient(ctx2d, color, canvas.height)
      ctx2d.shadowColor = withAlpha(color, 0.28) || 'rgba(37,99,235,0.28)'
      ctx2d.shadowBlur = 10 * dpr

      let x = 0
      for (let i = 0; i < dataRef.current.length; i += step) {
        const v = Math.abs(dataRef.current[i] - 128) / 128
        const h = Math.max(6 * dpr, Math.floor(v * canvas.height))
        drawRoundedBar(ctx2d, x, centerY - h / 2, barWidth, h)
        x += barWidth + gap
      }
      ctx2d.restore()
    }

    const draw = () => {
      const usePeaks = (peaks && peaks.length) ? peaks : (computedPeaks && computedPeaks.length ? computedPeaks : null)
      if (usePeaks) drawBarsFromPeaks(usePeaks); else drawAnalyser()

      const a = audioRef.current
      if (a && a.duration > 0) {
        const p = clamp(a.currentTime / a.duration, 0, 1)
        const xPos = p * canvas.width
        if (xPos > 0) {
          ctx2d.save()
          ctx2d.globalCompositeOperation = 'lighter'
          ctx2d.fillStyle = withAlpha(color, lightTone ? 0.38 : 0.22) || 'rgba(255,255,255,0.18)'
          ctx2d.fillRect(0, 0, xPos, canvas.height)
          ctx2d.restore()
        }
        ctx2d.strokeStyle = withAlpha(color, lightTone ? 0.65 : 0.5) || adjustColor(color, -0.1)
        ctx2d.lineWidth = Math.max(2, Math.floor(1.6 * dpr))
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
      draw()
    }

    const onTime = () => setCurrentTime(audio.currentTime || 0)
    const onLoaded = () => setDuration(audio.duration || 0)

    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('ended', onPause)
    audio.addEventListener('timeupdate', onTime)
    audio.addEventListener('loadedmetadata', onLoaded)

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
  }, [src, peaks, computedPeaks, waveformHeight, color, resolvedBg, lightTone])

  const progress = duration > 0 ? clamp(currentTime / duration, 0, 1) : 0
  const iconColor = lightTone ? '#2563eb' : '#ffffff'
  const timeColor = lightTone ? 'rgba(255,255,255,0.85)' : 'rgba(55,65,81,0.82)'
  const playBgColor = playBg || (lightTone ? adjustColor(color, -0.25) : color)

  if (variant === 'bubble') {
    const buttonSize = Math.max(40, Math.floor(waveformHeight * 1.65))
    const buttonGradientStart = adjustColor(playBgColor, 0.3)
    const buttonGradientEnd = adjustColor(playBgColor, -0.18)
    const buttonShadow = withAlpha(playBgColor, 0.36) || 'rgba(37,99,235,0.32)'
    const shellPaddingY = Math.round(Math.max(8, waveformHeight * 0.35))
    const shellPaddingX = shellPaddingY + 4
    const bubbleGradientStart = withAlpha(color, lightTone ? 0.32 : 0.18) || 'rgba(148,163,184,0.18)'
    const bubbleGradientEnd = withAlpha(color, lightTone ? 0.14 : 0.08) || 'rgba(148,163,184,0.08)'
    const bubbleBorder = withAlpha(color, lightTone ? 0.45 : 0.2) || 'rgba(148,163,184,0.2)'
    const bubbleShadow = withAlpha(color, lightTone ? 0.28 : 0.22) || 'rgba(15,23,42,0.22)'

    return (
      <div className="w-full">
        <audio ref={audioRef} src={src} preload="metadata" crossOrigin="anonymous" />
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={() => {
              const a = audioRef.current
              if (!a) return
              if (a.paused) a.play(); else a.pause()
            }}
            className="flex items-center justify-center rounded-full transition-transform duration-200 hover:scale-[1.03] active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2"
            style={{
              width: buttonSize,
              height: buttonSize,
              background: `linear-gradient(135deg, ${buttonGradientStart}, ${buttonGradientEnd})`,
              color: iconColor,
              boxShadow: `0 12px 26px ${buttonShadow}`
            }}
            aria-label="Reproduzir/Pausar áudio"
          >
            {isPlaying ? <Pause size={Math.max(16, Math.floor(buttonSize * 0.45))} /> : <Play size={Math.max(16, Math.floor(buttonSize * 0.45))} />}
          </button>

          <div className="flex-1 space-y-2">
            <div
              className="relative select-none overflow-hidden rounded-2xl transition-transform duration-150 active:scale-[0.995]"
              style={{
                padding: `${shellPaddingY}px ${shellPaddingX}px`,
                background: `linear-gradient(135deg, ${bubbleGradientStart}, ${bubbleGradientEnd})`,
                border: `1px solid ${bubbleBorder}`,
                boxShadow: `0 18px 34px ${bubbleShadow}`,
                backdropFilter: 'blur(12px)'
              }}
              onClick={(e) => {
                const a = audioRef.current
                const canvas = canvasRef.current
                if (!a || !canvas || !duration) return
                const rect = canvas.getBoundingClientRect()
                const x = e.clientX - rect.left
                const p = clamp(x / rect.width, 0, 1)
                a.currentTime = p * duration
              }}
            >
              <canvas
                ref={canvasRef}
                style={{ width: '100%', height: `${waveformHeight}px`, display: 'block' }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] tabular-nums" style={{ color: timeColor }}>
              <span>{fmt(currentTime)}</span>
              <span>{fmt(duration)}</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const progressDotColor = adjustColor(color, lightTone ? -0.4 : -0.18)
  const dotBorder = lightTone ? withAlpha('#ffffff', 0.85) || 'rgba(255,255,255,0.85)' : withAlpha(color, 0.45) || 'rgba(37,99,235,0.45)'

  return (
    <div className="w-full flex items-center gap-2">
      <audio ref={audioRef} src={src} preload="metadata" crossOrigin="anonymous" />
      <button
        type="button"
        onClick={() => {
          const a = audioRef.current
          if (!a) return
          if (a.paused) a.play(); else a.pause()
        }}
        className="w-9 h-9 rounded-full flex items-center justify-center shadow-md transition-transform duration-150 hover:scale-[1.05] active:scale-[0.95] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-white/70"
        style={{
          background: `linear-gradient(135deg, ${adjustColor(color, 0.3)}, ${adjustColor(color, -0.15)})`,
          color: iconColor
        }}
        aria-label="Reproduzir/Pausar áudio"
      >
        {isPlaying ? <Pause size={16} /> : <Play size={16} />}
      </button>

      <span className="text-[11px] tabular-nums text-center" style={{ color: timeColor, minWidth: 38 }}>{fmt(currentTime)}</span>

      <div
        className="flex-1 relative select-none overflow-hidden rounded-xl"
        style={{ height: waveformHeight }}
        onClick={(e) => {
          const a = audioRef.current
          const canvas = canvasRef.current
          if (!a || !canvas || !duration) return
          const rect = canvas.getBoundingClientRect()
          const x = e.clientX - rect.left
          const p = clamp(x / rect.width, 0, 1)
          a.currentTime = p * duration
        }}
      >
        <canvas
          ref={canvasRef}
          style={{ width: '100%', height: `${waveformHeight}px`, display: 'block' }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 pointer-events-none w-3 h-3 rounded-full shadow"
          style={{
            left: `calc(${progress * 100}% - 6px)`,
            backgroundColor: progressDotColor,
            border: `1px solid ${dotBorder}`
          }}
        />
      </div>

      <span className="text-[11px] tabular-nums text-center" style={{ color: timeColor, minWidth: 38 }}>{fmt(duration)}</span>
    </div>
  )
}

export default PlaybackWaveform
