import React from 'react'
import Header from './Header'
import BottomNavigation from './BottomNavigation'

const Layout = ({ children }) => {
  return (
    <div className="flex flex-col h-screen">
      <Header />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
      <BottomNavigation />
    </div>
  )
}

export default Layout
