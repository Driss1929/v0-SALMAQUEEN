"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { useAuth } from "./AuthContext"

interface Notification {
  id: string
  type: "like" | "comment" | "share" | "post" | "reel" | "story" | "message" | "journal"
  title: string
  message: string
  fromUser: string
  fromUserName: string
  targetId?: string
  targetType?: "post" | "reel" | "story" | "journal"
  timestamp: number
  read: boolean
  icon: string
}

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  addNotification: (notification: Omit<Notification, "id" | "timestamp" | "read">) => void
  markAsRead: (notificationId: string) => void
  markAllAsRead: () => void
  clearNotifications: () => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const { currentUser } = useAuth()

  useEffect(() => {
    if (typeof window !== "undefined" && currentUser) {
      const savedNotifications = localStorage.getItem(`notifications_${currentUser.username}`)
      if (savedNotifications) {
        try {
          const parsed = JSON.parse(savedNotifications)
          setNotifications(parsed)
        } catch (error) {
          console.error("[v0] Error loading notifications:", error)
        }
      }
    }
  }, [currentUser])

  useEffect(() => {
    if (typeof window !== "undefined" && currentUser && notifications.length > 0) {
      localStorage.setItem(`notifications_${currentUser.username}`, JSON.stringify(notifications))
    }
  }, [notifications, currentUser])

  useEffect(() => {
    if (typeof window !== "undefined" && currentUser) {
      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === `newNotification_${currentUser.username}` && e.newValue) {
          try {
            const newNotification = JSON.parse(e.newValue)
            setNotifications((prev) => [newNotification, ...prev.slice(0, 49)]) // Keep max 50 notifications
            localStorage.removeItem(`newNotification_${currentUser.username}`)
          } catch (error) {
            console.error("[v0] Error processing new notification:", error)
          }
        }
      }

      window.addEventListener("storage", handleStorageChange)
      return () => window.removeEventListener("storage", handleStorageChange)
    }
  }, [currentUser])

  const addNotification = (notificationData: Omit<Notification, "id" | "timestamp" | "read">) => {
    if (!currentUser) return

    const notification: Notification = {
      ...notificationData,
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      read: false,
    }

    if (notificationData.fromUser !== currentUser.username) {
      setNotifications((prev) => [notification, ...prev.slice(0, 49)])
    }

    const otherUser = currentUser.username === "idriss" ? "salma" : "idriss"
    if (notificationData.fromUser === currentUser.username && typeof window !== "undefined") {
      localStorage.setItem(`newNotification_${otherUser}`, JSON.stringify(notification))
    }

    console.log("[v0] Added notification:", notification)
  }

  const markAsRead = (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((notification) => (notification.id === notificationId ? { ...notification, read: true } : notification)),
    )
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })))
  }

  const clearNotifications = () => {
    setNotifications([])
    if (typeof window !== "undefined" && currentUser) {
      localStorage.removeItem(`notifications_${currentUser.username}`)
    }
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider")
  }
  return context
}
