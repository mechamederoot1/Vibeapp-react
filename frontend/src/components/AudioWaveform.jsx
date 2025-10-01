import React, { useEffect, useRef } from 'react'

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

      ctx2d.lineWidth = 2 * dpr
      ctx2d.strokeStyle = color
      ctx2d.beginPath()

      const sliceWidth = canvas.width / bufferLength
      let x = 0
      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0
        const y = (v * canvas.height) / 2
        if (i === 0) ctx2d.moveTo(x, y)
        else ctx2d.lineTo(x, y)
        x += sliceWidth
      }
      ctx2d.lineTo(canvas.width, canvas.height / 2)
      ctx2d.stroke()

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

export const PlaybackWaveform = ({ src, height = 36, color = '#2563eb', bg = '#e5e7eb' }) => {
  const canvasRef = useRef(null)
  const audioRef = useRef(null)
  const rafRef = useRef(null)
  const audioCtxRef = useRef(null)
  const analyserRef = useRef(null)
  const sourceRef = useRef(null)
  const dataRef = useRef(null)

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

    const draw = () => {
      if (!analyserRef.current || !dataRef.current) return
      analyserRef.current.getByteTimeDomainData(dataRef.current)
      ctx2d.fillStyle = bg
      ctx2d.fillRect(0, 0, canvas.width, canvas.height)

      ctx2d.lineWidth = 2 * dpr
      ctx2d.strokeStyle = color
      ctx2d.beginPath()

      const bufferLength = dataRef.current.length
      const sliceWidth = canvas.width / bufferLength
      let x = 0
      for (let i = 0; i < bufferLength; i++) {
        const v = dataRef.current[i] / 128.0
        const y = (v * canvas.height) / 2
        if (i === 0) ctx2d.moveTo(x, y)
        else ctx2d.lineTo(x, y)
        x += sliceWidth
      }
      ctx2d.lineTo(canvas.width, canvas.height / 2)
      ctx2d.stroke()
      rafRef.current = requestAnimationFrame(draw)
    }

    const onPlay = async () => {
      setup()
      try { await audioCtxRef.current.resume() } catch (e) {}
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      draw()
    }

    const onPause = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }

    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('ended', onPause)

    return () => {
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('ended', onPause)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      try { sourceRef.current && sourceRef.current.disconnect() } catch (e) {}
      try { analyserRef.current && analyserRef.current.disconnect() } catch (e) {}
      try { audioCtxRef.current && audioCtxRef.current.close() } catch (e) {}
    }
  }, [src, height, color, bg])

  return (
    <div className="w-full flex items-center gap-3">
      <audio ref={audioRef} src={src} preload="metadata" />
      <button
        onClick={() => {
          const a = audioRef.current
          if (!a) return
          if (a.paused) a.play(); else a.pause()
        }}
        className="px-3 py-2 rounded-lg bg-gray-100 text-gray-800 hover:bg-gray-200"
        aria-label="Reproduzir/Pausar áudio"
      >
        ▶︎
      </button>
      <div className="flex-1" style={{ height }}>
        <canvas ref={canvasRef} style={{ width: '100%', height: `${height}px`, display: 'block', borderRadius: 8 }} />
      </div>
    </div>
  )
}

export default PlaybackWaveform
