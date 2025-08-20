const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const app = express();

// Configuração
app.use(cors());
app.use(express.json());

// "Database" em memória
let users = [
  {
    id: 1,
    email: 'test@example.com',
    password: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
    firstName: 'Usuário',
    lastName: 'Teste',
    username: 'usuario_teste',
    bio: 'Olá! Bem-vindo ao meu perfil no Vibe Social! ✨',
    avatar: null,
    coverPhoto: null,
    location: '',
    website: '',
    phone: '',
    birthDate: '',
    gender: '',
    isVerified: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

let posts = [];
let personalInfos = {};
let workExperiences = {};
let educationEntries = {};

const JWT_SECRET = 'vibe-social-secret-key';

// Middleware de autenticação
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ detail: 'Token de acesso requerido' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ detail: 'Token inválido' });
    }
    req.user = user;
    next();
  });
};

// Rotas de autenticação
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;
    
    // Verificar se usuário já existe
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      return res.status(409).json({ detail: 'Este email já está cadastrado' });
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Criar novo usuário
    const newUser = {
      id: users.length + 1,
      email,
      password: hashedPassword,
      firstName,
      lastName,
      username: email.split('@')[0],
      bio: 'Olá! Bem-vindo ao meu perfil no Vibe Social! ✨',
      avatar: null,
      coverPhoto: null,
      location: '',
      website: '',
      phone: '',
      birthDate: '',
      gender: '',
      isVerified: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    users.push(newUser);

    // Gerar token
    const token = jwt.sign({ userId: newUser.id, email: newUser.email }, JWT_SECRET);

    // Remover senha da resposta
    const { password: _, ...userResponse } = newUser;

    res.json({
      user: userResponse,
      access_token: token,
      token_type: 'bearer'
    });
  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({ detail: 'Erro interno do servidor' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Encontrar usuário
    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({ detail: 'Email ou senha incorretos' });
    }

    // Verificar senha
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ detail: 'Email ou senha incorretos' });
    }

    // Gerar token
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET);

    // Remover senha da resposta
    const { password: _, ...userResponse } = user;

    res.json({
      user: userResponse,
      access_token: token,
      token_type: 'bearer'
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ detail: 'Erro interno do servidor' });
  }
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
  const user = users.find(u => u.id === req.user.userId);
  if (!user) {
    return res.status(404).json({ detail: 'Usuário não encontrado' });
  }

  const { password: _, ...userResponse } = user;
  res.json(userResponse);
});

// Rotas de usuário
app.get('/api/users/profile', authenticateToken, (req, res) => {
  const user = users.find(u => u.id === req.user.userId);
  if (!user) {
    return res.status(404).json({ detail: 'Usuário não encontrado' });
  }

  const { password: _, ...userResponse } = user;
  res.json(userResponse);
});

app.put('/api/users/profile', authenticateToken, (req, res) => {
  const userIndex = users.findIndex(u => u.id === req.user.userId);
  if (userIndex === -1) {
    return res.status(404).json({ detail: 'Usuário não encontrado' });
  }

  // Atualizar dados do usuário
  const updates = req.body;
  users[userIndex] = {
    ...users[userIndex],
    ...updates,
    updatedAt: new Date().toISOString()
  };

  const { password: _, ...userResponse } = users[userIndex];
  res.json(userResponse);
});

// Rotas de posts
app.get('/api/posts/feed', authenticateToken, (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  
  res.json({
    posts: posts,
    totalPages: 1,
    currentPage: page,
    totalPosts: posts.length
  });
});

app.post('/api/posts/', authenticateToken, (req, res) => {
  const newPost = {
    id: posts.length + 1,
    content: req.body.content,
    authorId: req.user.userId,
    author: users.find(u => u.id === req.user.userId),
    imageUrl: req.body.imageUrl || null,
    likes: 0,
    comments: 0,
    shares: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  posts.push(newPost);
  res.status(201).json(newPost);
});

// Rotas básicas de informações pessoais
app.get('/api/personal-info', authenticateToken, (req, res) => {
  const personalInfo = personalInfos[req.user.userId] || {};
  res.json({ personalInfo });
});

app.put('/api/personal-info', authenticateToken, (req, res) => {
  personalInfos[req.user.userId] = req.body;
  res.json({ personalInfo: req.body });
});

// Rotas de experiência de trabalho
app.get('/api/work-experience', authenticateToken, (req, res) => {
  const userWorkExp = workExperiences[req.user.userId] || [];
  res.json(userWorkExp);
});

app.post('/api/work-experience', authenticateToken, (req, res) => {
  if (!workExperiences[req.user.userId]) {
    workExperiences[req.user.userId] = [];
  }
  
  const newWork = {
    id: Date.now(),
    ...req.body,
    displayText: `${req.body.position} na ${req.body.company}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  workExperiences[req.user.userId].push(newWork);
  res.status(201).json(newWork);
});

// Rotas de educação
app.get('/api/education', authenticateToken, (req, res) => {
  const userEducation = educationEntries[req.user.userId] || [];
  res.json(userEducation);
});

app.post('/api/education', authenticateToken, (req, res) => {
  if (!educationEntries[req.user.userId]) {
    educationEntries[req.user.userId] = [];
  }
  
  const newEducation = {
    id: Date.now(),
    ...req.body,
    displayText: `${req.body.degree} - ${req.body.institution}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  educationEntries[req.user.userId].push(newEducation);
  res.status(201).json(newEducation);
});

// Rota de saúde
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Vibe Social API funcionando!' });
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📱 Vibe Social API está funcionando!`);
});

module.exports = app;
