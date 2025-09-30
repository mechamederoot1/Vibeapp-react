export function getPublicProfileId(user) {
  if (!user || !user.publicProfileId) return null
  return String(user.publicProfileId)
}

export function buildProfileUrl(userOrIdentifier) {
  if (!userOrIdentifier && userOrIdentifier !== 0) return '/profile'
  // primitive identifier (string or number)
  if (typeof userOrIdentifier === 'string' || typeof userOrIdentifier === 'number') {
    return `/profile/id/${encodeURIComponent(String(userOrIdentifier))}`
  }
  const pid = userOrIdentifier.publicProfileId || userOrIdentifier.public_profile_id
  if (pid) return `/profile/id/${encodeURIComponent(String(pid))}`
  if (userOrIdentifier.id) return `/profile/id/${encodeURIComponent(String(userOrIdentifier.id))}`
  if (userOrIdentifier.username) return `/profile/id/${encodeURIComponent(String(userOrIdentifier.username))}`
  return '/profile'
}
