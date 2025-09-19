export const generateVibeId = (length = 16) => {
  // Generate numeric-only random id to avoid collisions
  const array = new Uint32Array(length)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array)
  } else {
    for (let i = 0; i < length; i++) array[i] = Math.floor(Math.random() * 10)
  }
  // Convert to digits string
  let digits = ''
  for (let i = 0; i < length; i++) {
    digits += String(array[i] % 10)
  }
  return `vibe_${digits}`
}

export const withVibeIdParam = (url, id = generateVibeId()) => {
  if (!url) return url
  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}id=${encodeURIComponent(id)}`
}
