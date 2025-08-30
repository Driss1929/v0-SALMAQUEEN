"use client"
import { useAuth } from "../contexts/AuthContext"
import Login from "../components/Login"
import Dashboard from "../components/Dashboard"
import PostsFeed from "../components/PostsFeed"

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (!isAuthenticated) {
    return <Login />
  }

  return (
    <Dashboard>
      <PostsFeed />
    </Dashboard>
  )
}

export default AppContent
