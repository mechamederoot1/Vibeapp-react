export function getPublicProfileId(user) {
  try {
    const keyBase = user?.id ? `uid:${user.id}` : (user?.email ? `email:${user.email}` : 'anon')
    const storageKey = `vibe:publicProfileId:${keyBase}`
    let id = localStorage.getItem(storageKey)
    if (!id) {
      // Generate 9-10 digit numeric id
      const rand = Math.floor(100000000 + Math.random() * 900000000)
      id = String(rand)
      localStorage.setItem(storageKey, id)
    }
    return id
  } catch (e) {
    // Fallback: deterministic short id
    return String(Math.floor(100000 + Math.random() * 900000))
  }
}
