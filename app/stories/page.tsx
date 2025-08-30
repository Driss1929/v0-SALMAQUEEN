"use client"
import { useAuth } from "../../contexts/AuthContext"
import Login from "../../components/Login"
import Dashboard from "../../components/Dashboard"
import Stories from "../../components/Stories"

export default function StoriesPage() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (!isAuthenticated) {
    return <Login />
  }

  return (
    <Dashboard>
      <Stories />
    </Dashboard>
  )
}
