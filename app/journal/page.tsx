"use client"
import { useAuth } from "../../contexts/AuthContext"
import Login from "../../components/Login"
import Dashboard from "../../components/Dashboard"
import Journal from "../../components/Journal"

export default function JournalPage() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (!isAuthenticated) {
    return <Login />
  }

  return (
    <Dashboard>
      <Journal />
    </Dashboard>
  )
}
