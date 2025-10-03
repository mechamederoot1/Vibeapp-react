import React from 'react'
import { useLocation } from 'react-router-dom'
import Header from './Header'
import BottomNavigation from './BottomNavigation'
import useViewportHeight from '../hooks/useViewportHeight'

const Layout = ({ children, onOpenPostModal }) => {
  const location = useLocation();
  const isMessagesRoute = location.pathname && location.pathname.startsWith('/messages');
  const hasQueryConversation = (location.search && (location.search.includes('user=') || location.search.includes('userId=')));
  const isConversationOpened = isMessagesRoute && (hasQueryConversation || location.pathname.startsWith('/messages/'));
  const viewportHeight = useViewportHeight();
  const dynamicHeight = viewportHeight ? `${viewportHeight}px` : undefined;
  const containerStyle = dynamicHeight
    ? {
        minHeight: dynamicHeight
      }
    : undefined;
  const mainStyle = {
    overflowY: 'auto'
  };

  const isFeedRoute = location.pathname === '/' || location.pathname.startsWith('/feed');

  const shouldShowHeader = isFeedRoute || !isConversationOpened;
  const shouldShowBottomNav = isFeedRoute || !isConversationOpened;

  return (
    <div className="flex flex-col min-h-screen overflow-x-hidden w-screen max-w-screen relative" style={containerStyle}>
      {shouldShowHeader && <Header onOpenPostModal={onOpenPostModal} />}

      <main className="flex-1 overflow-x-hidden w-full max-w-full relative min-h-0" style={mainStyle}>
        <div className="w-full max-w-full overflow-x-hidden">
          {children}
        </div>
      </main>

      {shouldShowBottomNav && <BottomNavigation />}
    </div>
  )
}

export default Layout
