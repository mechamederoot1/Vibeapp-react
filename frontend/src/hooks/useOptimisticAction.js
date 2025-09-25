import { useRef } from 'react'

export default function useOptimisticAction() {
  const inFlightRef = useRef(false)

  const run = async ({ apply, commit }) => {
    if (inFlightRef.current) return
    inFlightRef.current = true
    let rollback
    try {
      rollback = apply?.()
      await commit?.()
    } catch (e) {
      if (typeof rollback === 'function') {
        try { rollback() } catch {}
      }
      throw e
    } finally {
      inFlightRef.current = false
    }
  }

  return { run }
}
