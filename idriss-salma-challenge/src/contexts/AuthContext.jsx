import React, { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext()

// Mock user database
const users = [
  { username: 'idriss', password: 'IDRISSKING', name: 'Idriss', color: 'pink' },
  { username: 'salma', password: 'SALMAQUEEN', name: 'Salma', color: 'blue' }
]

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Check if user is already logged in on app load
  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser')
    if (savedUser) {
      const user = JSON.parse(savedUser)
      setCurrentUser(user)
      setIsAuthenticated(true)
    }
  }, [])

  // Login function
  const login = (username, password) => {
    const user = users.find(u => u.username === username && u.password === password)
    if (user) {
      const userInfo = {
        username: user.username,
        name: user.name,
        color: user.color
      }
      setCurrentUser(userInfo)
      setIsAuthenticated(true)
      localStorage.setItem('currentUser', JSON.stringify(userInfo))
      return { success: true, user: userInfo }
    } else {
      return { success: false, message: 'Invalid username or password' }
    }
  }

  // Logout function
  const logout = () => {
    setCurrentUser(null)
    setIsAuthenticated(false)
    localStorage.removeItem('currentUser')
  }

  const value = {
    currentUser,
    isAuthenticated,
    login,
    logout
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
