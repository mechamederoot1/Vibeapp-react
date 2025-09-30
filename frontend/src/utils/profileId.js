export function getPublicProfileId(user) {
  try {
    if (user?.publicProfileId) return String(user.publicProfileId)
    const keyBase = user?.id ? `uid:${user.id}` : (user?.email ? `email:${user.email}` : 'anon')
    const storageKey = `vibe:publicProfileId:${keyBase}`
    let id = localStorage.getItem(storageKey)
    if (!id) {
      // Generate 12 digit numeric id (client-side fallback)
      let rand = ''
      for (let i = 0; i < 12; i++) rand += Math.floor(Math.random() * 10)
      id = String(rand)
      localStorage.setItem(storageKey, id)
    }
    return id
  } catch (e) {
    // Fallback: 12-digit numeric
    let rand = ''
    for (let i = 0; i < 12; i++) rand += Math.floor(Math.random() * 10)
    return rand
  }
}

export function buildProfileUrl(userOrIdentifier) {
  let id = userOrIdentifier
  if (userOrIdentifier && typeof userOrIdentifier === 'object') {
    id = userOrIdentifier.publicProfileId || userOrIdentifier.public_profile_id || userOrIdentifier.id || userOrIdentifier.username
  }
  return `/profile/id/${encodeURIComponent(String(id))}`
}
