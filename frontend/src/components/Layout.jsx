import React from 'react'
import { useLocation } from 'react-router-dom'
import Header from './Header'
import BottomNavigation from './BottomNavigation'

const Layout = ({ children, onOpenPostModal }) => {
  const location = useLocation();
  const isMessagesRoute = location.pathname && location.pathname.startsWith('/messages');

  return (
    <div className="flex flex-col h-screen overflow-x-hidden w-screen max-w-screen relative">
      {!isMessagesRoute && <Header onOpenPostModal={onOpenPostModal} />}

      <main className={`flex-1 overflow-x-hidden w-full max-w-full relative ${isMessagesRoute ? 'h-screen' : ''}`} style={{overflowY: 'scroll'}}>
        <div className="w-full max-w-full overflow-x-hidden">
          {children}
        </div>
      </main>

      {!isMessagesRoute && <BottomNavigation />}
    </div>
  )
}

export default Layout
