import React from 'react'
import { useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'

function Dashboard({ children }) {
  const location = useLocation()
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-blue-50">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-80 p-4 hidden lg:block">
          <Sidebar />
        </div>
        
        {/* Mobile Sidebar Toggle */}
        <div className="lg:hidden fixed top-4 left-4 z-50">
          <button
            onClick={() => document.getElementById('mobile-sidebar').classList.toggle('hidden')}
            className="bg-white p-3 rounded-xl shadow-lg"
          >
            ☰
          </button>
        </div>

        {/* Mobile Sidebar */}
        <div id="mobile-sidebar" className="lg:hidden fixed inset-0 z-40 hidden">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => document.getElementById('mobile-sidebar').classList.add('hidden')}></div>
          <div className="fixed left-0 top-0 h-full w-80 p-4">
            <Sidebar />
          </div>
        </div>

        {/* Main Content */}
        <div 
          key={location.pathname}
          className="flex-1 p-4 animate-fade-in"
        >
          {children}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
