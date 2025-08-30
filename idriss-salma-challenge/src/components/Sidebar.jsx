import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

function Sidebar() {
  const location = useLocation()
  const { currentUser, logout } = useAuth()

  const navItems = [
    { path: '/', label: '🏠 Challenge', icon: '🏠' },
    { path: '/why', label: '💭 Why Page', icon: '💭' },
    { path: '/journal', label: '📖 Journal', icon: '📖' },
    { path: '/messages', label: '💬 Messages', icon: '💬' }
  ]

  return (
    <div className="bg-white shadow-xl rounded-2xl p-6 min-h-screen">
             {/* User Info */}
       <div className="text-center mb-8 pb-6 border-b border-gray-200">
         <div className="w-16 h-16 rounded-full mx-auto mb-3 overflow-hidden border-2 border-gray-200">
                       <img
              src={currentUser.username === 'idriss' ? '/idriss-profile.jpg' : '/salma-profile.jpg'}
              alt={`${currentUser.name}'s profile`}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Try SVG fallback first
                if (e.target.src.includes('.jpg')) {
                  e.target.src = currentUser.username === 'idriss' ? '/idriss-profile.svg' : '/salma-profile.svg'
                } else {
                  // Fallback to colored initial if both images fail
                  e.target.style.display = 'none'
                  e.target.nextSibling.style.display = 'flex'
                }
              }}
            />
           <div className={`w-full h-full flex items-center justify-center text-2xl ${
             currentUser.color === 'pink' ? 'bg-pink-100 text-pink-600' : 'bg-blue-100 text-blue-600'
           }`} style={{ display: 'none' }}>
             {currentUser.name.charAt(0)}
           </div>
         </div>
         <h3 className="font-bold text-gray-800">{currentUser.name}</h3>
         <p className="text-sm text-gray-500">Welcome back!</p>
       </div>

      {/* Navigation */}
      <nav className="space-y-2 mb-8">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
              location.pathname === item.path
                ? 'bg-gradient-to-r from-pink-400 to-blue-500 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            <span className="font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Logout Button */}
      <div className="pt-6 border-t border-gray-200">
        <button
          onClick={logout}
          className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-500 hover:bg-red-600 text-white font-medium rounded-xl transition-colors duration-200"
        >
          <span>🚪</span>
          <span>Logout</span>
        </button>
      </div>
    </div>
  )
}

export default Sidebar
