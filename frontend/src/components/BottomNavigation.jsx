import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Home, Search, PlusCircle, Bell, User } from 'lucide-react'

const BottomNavigation = () => {
  const location = useLocation()
  const navigate = useNavigate()

  const navItems = [
    { path: '/', icon: Home, label: 'Feed' },
    { path: '/explore', icon: Search, label: 'Explorar' },
    { path: '/create', icon: PlusCircle, label: 'Criar' },
    { path: '/notifications', icon: Bell, label: 'Notificações' },
    { path: '/profile', icon: User, label: 'Perfil' },
  ]

  return (
    <nav className="bg-white border-t border-gray-200 safe-area-bottom">
      <div className="flex justify-around py-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path
          
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
                isActive 
                  ? 'text-vibe-blue' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon 
                size={24} 
                className={isActive ? 'fill-current' : ''}
              />
              <span className="text-xs mt-1 font-medium">
                {item.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

export default BottomNavigation
