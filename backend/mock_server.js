const http = require('http')
const url = require('url')

const PORT = process.env.PORT || 3010

let users = []
let tokens = {}

function parseJSONBody(req) {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', chunk => body += chunk)
    req.on('end', () => {
      if (!body) return resolve({})
      try {
        resolve(JSON.parse(body))
      } catch (e) {
        reject(e)
      }
    })
    req.on('error', err => reject(err))
  })
}

function sendJSON(res, status, payload) {
  const body = JSON.stringify(payload)
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  })
  res.end(body)
}

function generateToken() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

const server = http.createServer(async (req, res) => {
  const parsed = url.parse(req.url, true)
  const path = parsed.pathname
  if (req.method === 'OPTIONS') {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    })
    return res.end()
  }

  // Health
  if (req.method === 'GET' && (path === '/' || path === '/api/health' || path === '/health')) {
    return sendJSON(res, 200, { status: 'healthy', message: 'Mock backend running' })
  }

  // Auth: register
  if (req.method === 'POST' && path === '/api/auth/register') {
    try {
      const body = await parseJSONBody(req)
      const { email, password, firstName, lastName, gender, birthDate } = body
      if (!email || !password) {
        return sendJSON(res, 400, { detail: 'Email and password required' })
      }
      const exists = users.find(u => u.email === email)
      if (exists) {
        return sendJSON(res, 409, { detail: 'Email already registered' })
      }
      const id = users.length + 1
      const user = { id, email, firstName: firstName || '', lastName: lastName || '', gender: gender || '', birthDate: birthDate || '' }
      users.push({ ...user, password })
      const token = generateToken()
      tokens[token] = id
      return sendJSON(res, 201, { user, access_token: token })
    } catch (e) {
      return sendJSON(res, 500, { detail: 'Invalid JSON' })
    }
  }

  // Auth: login
  if (req.method === 'POST' && path === '/api/auth/login') {
    try {
      const body = await parseJSONBody(req)
      const { email, password } = body
      if (!email || !password) return sendJSON(res, 400, { detail: 'Email and password required' })
      const user = users.find(u => u.email === email && u.password === password)
      if (!user) return sendJSON(res, 401, { detail: 'Invalid credentials' })
      const token = generateToken()
      tokens[token] = user.id
      const { password: pw, ...userData } = user
      return sendJSON(res, 200, { user: userData, access_token: token })
    } catch (e) {
      return sendJSON(res, 500, { detail: 'Invalid JSON' })
    }
  }

  // Auth: me
  if (req.method === 'GET' && path === '/api/auth/me') {
    const auth = req.headers['authorization'] || ''
    const parts = auth.split(' ')
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return sendJSON(res, 401, { detail: 'Unauthorized' })
    }
    const token = parts[1]
    const userId = tokens[token]
    if (!userId) return sendJSON(res, 401, { detail: 'Invalid token' })
    const user = users.find(u => u.id === userId)
    if (!user) return sendJSON(res, 404, { detail: 'User not found' })
    const { password: pw, ...userData } = user
    return sendJSON(res, 200, userData)
  }

  // Fallback
  sendJSON(res, 404, { detail: 'Not found' })
})

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Mock backend listening on http://0.0.0.0:${PORT}`)
})
