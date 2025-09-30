export function getPublicProfileId(user) {
  if (!user || !user.publicProfileId) return null
  return String(user.publicProfileId)
}

export function buildProfileUrl(user) {
  const pid = user && (user.publicProfileId || user.public_profile_id)
  return pid ? `/profile/id/${encodeURIComponent(String(pid))}` : '/profile'
}
