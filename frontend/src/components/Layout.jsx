import React from 'react'
import Header from './Header'
import BottomNavigation from './BottomNavigation'

const Layout = ({ children }) => {
  return (
    <div className="flex flex-col h-screen overflow-x-hidden w-full max-w-full">
      <Header />
      <main className="flex-1 overflow-y-auto overflow-x-hidden w-full">
        {children}
      </main>
      <BottomNavigation />
    </div>
  )
}

export default Layout
