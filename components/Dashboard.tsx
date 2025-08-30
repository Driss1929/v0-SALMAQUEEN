"use client"

import type React from "react"
import { useState } from "react"
import { usePathname } from "next/navigation"
import Sidebar from "./Sidebar"

interface DashboardProps {
  children: React.ReactNode
}

function Dashboard({ children }: DashboardProps) {
  const pathname = usePathname()
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-card to-background">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-80 p-4 hidden lg:block">
          <Sidebar />
        </div>

        {/* Mobile Sidebar Toggle */}
        <div className="lg:hidden fixed top-4 left-4 z-50">
          <button
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            className="bg-card p-3 rounded-xl shadow-lg border border-border"
          >
            ☰
          </button>
        </div>

        {/* Mobile Sidebar */}
        <div className={`lg:hidden fixed inset-0 z-40 ${isMobileSidebarOpen ? "" : "hidden"}`}>
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setIsMobileSidebarOpen(false)}></div>
          <div className="fixed left-0 top-0 h-full w-80 p-4">
            <Sidebar />
          </div>
        </div>

        {/* Main Content */}
        <div key={pathname} className="flex-1 p-4 animate-fade-in">
          {children}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
