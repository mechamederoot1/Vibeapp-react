import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom'
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
import PostDetail from './pages/PostDetail'
import ProfilePhotoView from './pages/ProfilePhotoView'
import ProfileCoverView from './pages/ProfileCoverView'
import Friends from './pages/Friends'
import Login from './pages/Login'
import LoginPage from './pages/LoginPage'
import Register from './pages/Register'
import SplashScreen from './components/SplashScreen'
import VibeLogoSimple from './components/VibeLogoSimple'
import PermissionsHandler from './components/PermissionsHandler'
import useWebSocket from './hooks/useWebSocket'
import { api } from './services/api'
import { useState, useEffect } from 'react'

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <VibeLogoSimple size="xl" />
          <div className="mt-4 text-gray-600">Carregando...</div>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <VibeLogoSimple size="xl" />
          <div className="mt-4 text-gray-600">Carregando...</div>
        </div>
      </div>
    )
  }

  if (user) {
    return <Navigate to="/feed" replace />
  }

  return children
}

const LegacyPostRedirect = () => {
  const { publicId } = useParams()
  return <Navigate to={`/posts/id/${publicId}`} replace />
}

const AppContent = () => {
  const [isPostModalOpen, setIsPostModalOpen] = useState(false)
  const [permissionsGranted, setPermissionsGranted] = useState(false)
  const { user } = useAuth()
  const { lastMessage } = useWebSocket()
  const [attentionAlert, setAttentionAlert] = useState(null)

  const handleOpenPostModal = () => setIsPostModalOpen(true)
  const handleClosePostModal = () => setIsPostModalOpen(false)

  const handlePermissionsGranted = (permissions) => {
    console.log('Permissions granted:', permissions)
    setPermissionsGranted(true)
  }

  // Unlock audio on first user gesture so notification sounds can play later
  useEffect(() => {
    import('./utils/notificationSound').then(mod => mod.unlockAudioOnGesture()).catch(()=>{});
  }, []);

  // Show centered attention alert globally for 2 seconds
  useEffect(() => {
    if (!lastMessage || lastMessage.type !== 'call_attention') return;
    (async () => {
      try {
        const sid = lastMessage.data?.senderId;
        let name = 'Fulano';
        if (sid) {
          const res = await api.get(`/users/${sid}`);
          const other = res.data;
          name = (other && (other.firstName || other.full_name || other.name)) ? (other.firstName || other.full_name || other.name) : name;
        }
        setAttentionAlert(`${name} chamou sua tenção!`);
        setTimeout(() => setAttentionAlert(null), 2000);
      } catch (e) {
        setAttentionAlert('Fulano chamou sua tenção!');
        setTimeout(() => setAttentionAlert(null), 2000);
      }
    })();
  }, [lastMessage]);

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
          path="/messages/:id"
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
          path="/profile/id/:publicId"
          element={
            <ProtectedRoute>
              <Layout onOpenPostModal={handleOpenPostModal}>
                <Profile />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/:userId"
          element={
            <ProtectedRoute>
              <Layout onOpenPostModal={handleOpenPostModal}>
                <Profile />
              </Layout>
            </ProtectedRoute>
          }
        />
        {/* Post/Media detail routes */}
        <Route
          path="/post/id/:publicId"
          element={
            <ProtectedRoute>
              <LegacyPostRedirect />
            </ProtectedRoute>
          }
        />
        <Route
          path="/posts/id/:publicId"
          element={
            <ProtectedRoute>
              <Layout onOpenPostModal={handleOpenPostModal}>
                <PostDetail />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/photo/id/:publicId"
          element={
            <ProtectedRoute>
              <Layout onOpenPostModal={handleOpenPostModal}>
                <PostDetail mediaType="image" />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/photo/id/:photoId"
          element={
            <ProtectedRoute>
              <Layout onOpenPostModal={handleOpenPostModal}>
                <ProfilePhotoView />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/cover/id/:coverId"
          element={
            <ProtectedRoute>
              <Layout onOpenPostModal={handleOpenPostModal}>
                <ProfileCoverView />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/video/id/:publicId"
          element={
            <ProtectedRoute>
              <Layout onOpenPostModal={handleOpenPostModal}>
                <PostDetail mediaType="video" />
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


        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/feed" replace />} />
      </Routes>

      {/* Permissions Handler - only after authentication */}
      {user && (
        <PermissionsHandler onPermissionsGranted={handlePermissionsGranted} />
      )}
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
