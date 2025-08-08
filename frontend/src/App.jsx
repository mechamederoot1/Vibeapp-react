import React, { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'
import Feed from './pages/Feed'
import Profile from './pages/Profile'
import Explore from './pages/Explore'
import Notifications from './pages/Notifications'
import CreatePost from './pages/CreatePost'
import Login from './pages/Login'
import LoginPage from './pages/LoginPage'
import Register from './pages/Register'
import VibeLogo from './components/VibeLogo'

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-gradient-to-r from-vibe-blue to-vibe-blue-dark rounded-xl p-4 mx-auto mb-4 w-16 h-16 flex items-center justify-center animate-pulse">
            <VibeLogo size="lg" className="text-white" />
          </div>
          <h2 className="text-xl font-bold bg-gradient-to-r from-vibe-blue to-vibe-blue-dark bg-clip-text text-transparent mb-2">Vibe</h2>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}

const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-gradient-to-r from-vibe-blue to-vibe-blue-dark rounded-xl p-4 mx-auto mb-4 w-16 h-16 flex items-center justify-center animate-pulse">
            <VibeLogo size="lg" className="text-white" />
          </div>
          <h2 className="text-xl font-bold bg-gradient-to-r from-vibe-blue to-vibe-blue-dark bg-clip-text text-transparent mb-2">Vibe</h2>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to="/feed" replace />
  }

  return children
}

const AppContent = () => {
  const [isPostModalOpen, setIsPostModalOpen] = useState(false)

  const handleOpenPostModal = () => setIsPostModalOpen(true)
  const handleClosePostModal = () => setIsPostModalOpen(false)

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden w-screen max-w-screen relative">
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/login" 
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          } 
        />
        <Route 
          path="/register" 
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          } 
        />

        {/* Legacy login route */}
        <Route 
          path="/old-login" 
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } 
        />

        {/* Protected Routes */}
        <Route 
          path="/" 
          element={<Navigate to="/feed" replace />}
        />
        <Route 
          path="/feed" 
          element={
            <ProtectedRoute>
              <Layout onOpenPostModal={handleOpenPostModal}>
                <Feed
                  isPostModalOpen={isPostModalOpen}
                  onClosePostModal={handleClosePostModal}
                  onOpenPostModal={handleOpenPostModal}
                />
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/explore" 
          element={
            <ProtectedRoute>
              <Layout onOpenPostModal={handleOpenPostModal}>
                <Explore />
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/notifications" 
          element={
            <ProtectedRoute>
              <Layout onOpenPostModal={handleOpenPostModal}>
                <Notifications />
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <Layout onOpenPostModal={handleOpenPostModal}>
                <Profile />
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/create" 
          element={
            <ProtectedRoute>
              <CreatePost />
            </ProtectedRoute>
          } 
        />

        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/feed" replace />} />
      </Routes>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  )
}

export default App
