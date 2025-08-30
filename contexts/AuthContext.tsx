"use client"
import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { socketManager } from "../lib/socket"

const AuthContext = createContext<any>(null)

// Mock user database
const users = [
  { username: "idriss", password: "IDRISSKING", name: "Idriss", color: "pink" },
  { username: "salma", password: "SALMAQUEEN", name: "Salma", color: "blue" },
]

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Check if user is already logged in on app load
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedUser = localStorage.getItem("currentUser")
      if (savedUser) {
        const user = JSON.parse(savedUser)
        setCurrentUser(user)
        setIsAuthenticated(true)
      }
    }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    if (currentUser && isAuthenticated) {
      // Update user online status in database
      fetch(`/api/users/${currentUser.username}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_online: true, currentUser: currentUser.username }),
      }).catch(console.error)

      // Set up periodic status updates
      const statusInterval = setInterval(() => {
        fetch(`/api/users/${currentUser.username}/status`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_online: true, currentUser: currentUser.username }),
        }).catch(console.error)
      }, 30000) // Update every 30 seconds

      return () => {
        clearInterval(statusInterval)
        // Mark as offline when component unmounts
        fetch(`/api/users/${currentUser.username}/status`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_online: false, currentUser: currentUser.username }),
        }).catch(console.error)
      }
    }
  }, [currentUser, isAuthenticated])

  // Login function
  const login = (username: string, password: string) => {
    const user = users.find((u) => u.username === username && u.password === password)
    if (user) {
      const savedProfilePicture =
        typeof window !== "undefined" ? localStorage.getItem(`profilePicture_${username}`) : null

      const savedBio = typeof window !== "undefined" ? localStorage.getItem(`bio_${username}`) : null
      const savedPostsCount = typeof window !== "undefined" ? localStorage.getItem(`postsCount_${username}`) : null
      const savedReelsCount = typeof window !== "undefined" ? localStorage.getItem(`reelsCount_${username}`) : null

      const userInfo = {
        username: user.username,
        name: user.name,
        color: user.color,
        profilePicture: savedProfilePicture || null,
        bio: savedBio || `Hey there! I'm ${user.name} 👋`,
        postsCount: Number.parseInt(savedPostsCount || "0"),
        reelsCount: Number.parseInt(savedReelsCount || "0"),
        followersCount: user.username === "idriss" ? 1 : 1, // They follow each other
        followingCount: 1,
      }
      setCurrentUser(userInfo)
      setIsAuthenticated(true)
      if (typeof window !== "undefined") {
        localStorage.setItem("currentUser", JSON.stringify(userInfo))
      }
      return { success: true, user: userInfo }
    } else {
      return { success: false, message: "Invalid username or password" }
    }
  }

  const updateProfilePicture = (base64String: string) => {
    if (currentUser && typeof window !== "undefined") {
      const updatedUser = {
        ...currentUser,
        profilePicture: base64String,
      }
      setCurrentUser(updatedUser)
      localStorage.setItem("currentUser", JSON.stringify(updatedUser))
      localStorage.setItem(`profilePicture_${currentUser.username}`, base64String)
    }
  }

  const updateBio = (newBio: string) => {
    if (currentUser && typeof window !== "undefined") {
      const updatedUser = {
        ...currentUser,
        bio: newBio,
      }
      setCurrentUser(updatedUser)
      localStorage.setItem("currentUser", JSON.stringify(updatedUser))
      localStorage.setItem(`bio_${currentUser.username}`, newBio)
    }
  }

  const incrementPostsCount = () => {
    if (currentUser && typeof window !== "undefined") {
      const newCount = currentUser.postsCount + 1
      const updatedUser = {
        ...currentUser,
        postsCount: newCount,
      }
      setCurrentUser(updatedUser)
      localStorage.setItem("currentUser", JSON.stringify(updatedUser))
      localStorage.setItem(`postsCount_${currentUser.username}`, newCount.toString())
    }
  }

  const incrementReelsCount = () => {
    if (currentUser && typeof window !== "undefined") {
      const newCount = currentUser.reelsCount + 1
      const updatedUser = {
        ...currentUser,
        reelsCount: newCount,
      }
      setCurrentUser(updatedUser)
      localStorage.setItem("currentUser", JSON.stringify(updatedUser))
      localStorage.setItem(`reelsCount_${currentUser.username}`, newCount.toString())
    }
  }

  const logout = () => {
    if (currentUser) {
      // Mark user as offline
      fetch(`/api/users/${currentUser.username}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_online: false, currentUser: currentUser.username }),
      }).catch(console.error)

      // Disconnect Socket.io
      socketManager.disconnect()
    }

    setCurrentUser(null)
    setIsAuthenticated(false)
    if (typeof window !== "undefined") {
      localStorage.removeItem("currentUser")
    }
  }

  const value = {
    currentUser,
    isAuthenticated,
    isLoading,
    login,
    logout,
    updateProfilePicture,
    updateBio,
    incrementPostsCount,
    incrementReelsCount,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
