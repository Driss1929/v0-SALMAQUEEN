import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import Challenge from './components/Challenge'
import WhyPage from './WhyPage'
import Journal from './components/Journal'
import Messages from './components/Messages'

// Protected Route Component
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

function App() {
  const { isAuthenticated } = useAuth()

  return (
    <Routes>
      {/* Public Routes */}
      <Route 
        path="/login" 
        element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} 
      />
      
      {/* Protected Routes */}
      <Route path="/" element={
        <ProtectedRoute>
          <Dashboard>
            <Challenge />
          </Dashboard>
        </ProtectedRoute>
      } />
      
      <Route path="/why" element={
        <ProtectedRoute>
          <Dashboard>
            <WhyPage />
          </Dashboard>
        </ProtectedRoute>
      } />
      
      <Route path="/journal" element={
        <ProtectedRoute>
          <Dashboard>
            <Journal />
          </Dashboard>
        </ProtectedRoute>
      } />
      
      <Route path="/messages" element={
        <ProtectedRoute>
          <Dashboard>
            <Messages />
          </Dashboard>
        </ProtectedRoute>
      } />
      
      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
