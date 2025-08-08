import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Feed from './pages/Feed'
import Profile from './pages/Profile'
import Explore from './pages/Explore'
import Notifications from './pages/Notifications'
import CreatePost from './pages/CreatePost'
import Login from './pages/Login'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 overflow-x-hidden w-screen max-w-screen relative">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/create" element={<CreatePost />} />
          <Route path="/" element={
            <Layout>
              <Feed />
            </Layout>
          } />
          <Route path="/explore" element={
            <Layout>
              <Explore />
            </Layout>
          } />
          <Route path="/notifications" element={
            <Layout>
              <Notifications />
            </Layout>
          } />
          <Route path="/profile" element={
            <Layout>
              <Profile />
            </Layout>
          } />
        </Routes>
      </div>
    </Router>
  )
}

export default App
