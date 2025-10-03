import { api } from '../services/api'

let backendAvailable = null
let demoMode = false

const healthCheck = async () => {
  try {
    // Try a quick health check with small timeout
    const source = new AbortController()
    const timer = setTimeout(() => source.abort(), 3000)
    await api.get('/health', { signal: source.signal })
    clearTimeout(timer)
    backendAvailable = true
    demoMode = false
    try { window.__BACKEND_AVAILABLE__ = true; window.__DEMO_MODE__ = false } catch(e) {}
    return true
  } catch (e) {
    backendAvailable = false
    demoMode = true
    try { window.__BACKEND_AVAILABLE__ = false; window.__DEMO_MODE__ = true } catch(err) {}
    return false
  }
}

export const detectBackend = async () => {
  if (backendAvailable === null) {
    return await healthCheck()
  }
  return backendAvailable
}

export const isBackendAvailable = () => backendAvailable === true
export const isDemoMode = () => demoMode === true

export const setDemoMode = (enabled) => {
  demoMode = !!enabled
  backendAvailable = !enabled
  try { window.__DEMO_MODE__ = !!enabled; window.__BACKEND_AVAILABLE__ = !enabled } catch(e) {}
}
