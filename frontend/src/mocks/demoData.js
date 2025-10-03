// Simple deterministic demo data to use when backend is unavailable

const nowIso = () => new Date().toISOString()

export const demoUsers = [
  {
    id: 101,
    username: 'ana',
    firstName: 'Ana',
    lastName: 'Silva',
    fullName: 'Ana Silva',
    displayName: 'Ana Silva',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=400&auto=format&fit=crop',
    isVerified: true,
    publicProfileId: 'u-ana'
  },
  {
    id: 102,
    username: 'bruno',
    firstName: 'Bruno',
    lastName: 'Lima',
    fullName: 'Bruno Lima',
    displayName: 'Bruno Lima',
    avatar: 'https://images.unsplash.com/photo-1541534401786-2077eed87a72?q=80&w=400&auto=format&fit=crop',
    publicProfileId: 'u-bruno'
  },
  {
    id: 103,
    username: 'carla',
    firstName: 'Carla',
    lastName: 'Souza',
    fullName: 'Carla Souza',
    displayName: 'Carla Souza',
    avatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?q=80&w=400&auto=format&fit=crop',
    publicProfileId: 'u-carla'
  }
]

export const demoCurrentUser = {
  id: 1,
  username: 'demo',
  firstName: 'Demo',
  lastName: 'User',
  fullName: 'Demo User',
  displayName: 'Demo User',
  avatar: 'https://ui-avatars.com/api/?name=Demo+User&background=2563eb&color=fff',
  publicProfileId: 'u-demo'
}

const pick = (arr, i) => arr[i % arr.length]

export const generateDemoPosts = (page = 1, limit = 10) => {
  const posts = []
  const authors = demoUsers
  for (let i = 0; i < limit; i++) {
    const idx = (page - 1) * limit + i
    const author = pick(authors, idx)
    const kind = idx % 4
    const base = {
      id: 5000 + idx,
      publicId: `p-${5000 + idx}`,
      author,
      createdAt: new Date(Date.now() - (idx * 3600 * 1000)).toISOString(),
      likesCount: Math.floor(Math.random() * 120),
      commentsCount: Math.floor(Math.random() * 30),
      sharesCount: Math.floor(Math.random() * 15),
      repostsCount: Math.floor(Math.random() * 5),
      isLiked: Math.random() > 0.7,
      reactionCounts: { like: Math.floor(Math.random() * 80), love: Math.floor(Math.random() * 40) }
    }
    if (kind === 0) {
      posts.push({ ...base, type: 'text', content: 'Curtindo o dia no Vibe! ✨', backgroundColor: ['vibe','blue','green','purple','sunset'][idx%5] })
    } else if (kind === 1) {
      posts.push({ ...base, type: 'image', imageUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=1200&auto=format&fit=crop', content: 'Meu setup de hoje 💻' })
    } else if (kind === 2) {
      posts.push({ ...base, type: 'image', imageUrl: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1200&auto=format&fit=crop', content: 'Paisagens que inspiram 🌄' })
    } else {
      posts.push({ ...base, type: 'profile_update', profileUpdateType: 'avatar', imageUrl: author.avatar, content: `${author.firstName} atualizou a foto de perfil` })
    }
  }
  return posts
}

export const generateDemoStories = () => {
  return demoUsers.map((u, i) => ({
    author: u,
    hasUnviewed: i % 2 === 0,
    stories: [
      { id: 7000 + i * 10, type: 'image', content: 'Story do dia', mediaUrl: u.avatar, createdAt: nowIso() }
    ]
  }))
}

export const seedDemoConversations = () => {
  const keyConvs = 'demo:messages:conversations'
  const exist = localStorage.getItem(keyConvs)
  if (exist) return
  const threads = demoUsers.map((u, i) => ({
    id: u.id,
    otherUser: u,
    lastMessage: { id: 9000 + i, content: i%2 ? 'Vamos marcar algo!' : 'Oi! Tudo bem?', messageType: 'text', createdAt: nowIso() },
    unreadCount: i === 0 ? 2 : 0
  }))
  localStorage.setItem(keyConvs, JSON.stringify(threads))
  demoUsers.forEach((u, i) => {
    const k = `demo:messages:thread:${u.id}`
    const msgs = [
      { id: 9100 + i*10, senderId: u.id, receiverId: demoCurrentUser.id, content: 'Olá 👋', messageType: 'text', isRead: false, createdAt: nowIso(), sender: u, receiver: demoCurrentUser },
      { id: 9101 + i*10, senderId: demoCurrentUser.id, receiverId: u.id, content: 'Oi! Tudo bem?', messageType: 'text', isRead: false, createdAt: nowIso(), sender: demoCurrentUser, receiver: u }
    ]
    localStorage.setItem(k, JSON.stringify(msgs))
  })
}

export const getDemoConversations = () => {
  try { return JSON.parse(localStorage.getItem('demo:messages:conversations') || '[]') } catch(e) { return [] }
}
