import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'
import Feed from './pages/Feed'
import Profile from './pages/Profile'
import Explore from './pages/Explore'
import Search from './pages/Search'
import Notifications from './pages/Notifications'
import Messages from './pages/Messages'
import CreatePost from './pages/CreatePost'
import Settings from './pages/Settings'
import Visits from './pages/Visits'
import Friends from './pages/Friends'
import ReactionTest from './components/ReactionTest'
import Login from './pages/Login'
import LoginPage from './pages/LoginPage'
import Register from './pages/Register'
import SplashScreen from './components/SplashScreen'
import VibeLogoSimple from './components/VibeLogoSimple'
import DatabaseFixer from './components/DatabaseFixer'

const ProtectedRoute = ({ children }) => {
  // Autenticação temporariamente desabilitada para navegação livre
  return children
}

const PublicRoute = ({ children }) => {
  // Redirecionamento temporariamente desabilitado para navegação livre
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
          path="/search"
          element={
            <ProtectedRoute>
              <Layout onOpenPostModal={handleOpenPostModal}>
                <Search />
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
          path="/messages"
          element={
            <ProtectedRoute>
              <Layout onOpenPostModal={handleOpenPostModal}>
                <Messages />
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
          path="/visits"
          element={
            <ProtectedRoute>
              <Layout onOpenPostModal={handleOpenPostModal}>
                <Visits />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/friends"
          element={
            <ProtectedRoute>
              <Layout onOpenPostModal={handleOpenPostModal}>
                <Friends />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
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

        {/* Debug routes */}
        <Route
          path="/debug/database"
          element={
            <div className="min-h-screen bg-gray-50 py-8">
              <DatabaseFixer />
            </div>
          }
        />
        <Route
          path="/test/reactions"
          element={<ReactionTest />}
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
