"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { useAuth } from "../contexts/AuthContext"
import { useNotifications } from "../contexts/NotificationContext"
import ProfilePictureUpload from "./ProfilePictureUpload"

function Sidebar() {
  const pathname = usePathname()
  const { currentUser, logout } = useAuth()
  const { unreadCount } = useNotifications()
  const [showProfileUpload, setShowProfileUpload] = useState(false)

  const navItems = [
    { path: "/", label: "Challenge", icon: "🏠" },
    { path: "/feed", label: "Feed", icon: "🌟" },
    { path: "/profile", label: "Profile", icon: "👤" },
    { path: "/notifications", label: "Notifications", icon: "🔔", badge: unreadCount },
    { path: "/why", label: "Why Page", icon: "💭" },
    { path: "/journal", label: "Journal", icon: "📖" },
    { path: "/messages", label: "Messages", icon: "💬" },
    { path: "/stories", label: "Stories", icon: "📚" },
    { path: "/settings", label: "Customization", icon: "🎨" }, // Added customization settings to navigation
  ]

  if (!currentUser) return null

  return (
    <>
      <div className="bg-white shadow-xl rounded-2xl p-6 min-h-screen">
        {/* User Info */}
        <div className="text-center mb-8 pb-6 border-b border-gray-200">
          <div
            className="w-16 h-16 rounded-full mx-auto mb-3 overflow-hidden border-2 border-gray-200 cursor-pointer hover:border-gray-400 transition-colors relative group"
            onClick={() => setShowProfileUpload(true)}
          >
            <img
              src={
                currentUser.profilePicture ||
                (currentUser.username === "idriss" ? "/idriss-profile.jpg" : "/salma-profile.jpg")
              }
              alt={`${currentUser.name}'s profile`}
              className="w-full h-full object-cover group-hover:opacity-80 transition-opacity"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.style.display = "none"
                const fallback = target.nextSibling as HTMLElement
                if (fallback) {
                  fallback.style.display = "flex"
                }
              }}
            />
            <div
              className={`w-full h-full flex items-center justify-center text-2xl ${
                currentUser.color === "pink" ? "bg-pink-100 text-pink-600" : "bg-blue-100 text-blue-600"
              } group-hover:opacity-80 transition-opacity`}
              style={{ display: "none" }}
            >
              {currentUser.name.charAt(0)}
            </div>
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-white text-lg">📷</span>
            </div>
          </div>
          <h3 className="font-bold text-gray-800">{currentUser.name}</h3>
          <p className="text-sm text-gray-500">Welcome back!</p>
          <p className="text-xs text-gray-400 mt-1">Click photo to change</p>
        </div>

        {/* Navigation */}
        <nav className="space-y-2 mb-8">
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 ${
                pathname === item.path
                  ? "bg-gradient-to-r from-pink-400 to-blue-500 text-white shadow-lg"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-800"
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className="text-lg">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </div>
              {item.badge && item.badge > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full min-w-[20px] text-center">
                  {item.badge > 99 ? "99+" : item.badge}
                </span>
              )}
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

      {showProfileUpload && <ProfilePictureUpload onClose={() => setShowProfileUpload(false)} />}
    </>
  )
}

export default Sidebar
