"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useAuth } from "../contexts/AuthContext"
import { useNotifications } from "../contexts/NotificationContext"

// Notification component
interface NotificationProps {
  message: string
  type: "success" | "info"
  onClose: () => void
}

function Notification({ message, type, onClose }: NotificationProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div
      className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-lg transition-all duration-300 transform translate-x-0 ${
        type === "success" ? "bg-green-500 text-white" : "bg-blue-500 text-white"
      }`}
    >
      <div className="flex items-center space-x-2">
        <span>{type === "success" ? "✅" : "📖"}</span>
        <span className="font-medium">{message}</span>
        <button onClick={onClose} className="ml-2 text-white hover:text-gray-200">
          ×
        </button>
      </div>
    </div>
  )
}

interface JournalEntry {
  id: number
  text: string
  author: string
  authorName: string
  timestamp: string
  day: number
}

function Journal() {
  const [journalEntries, setJournalEntries] = useState<Record<number, Record<string, JournalEntry>>>({})
  const [newEntry, setNewEntry] = useState("")
  const [selectedDay, setSelectedDay] = useState(1)
  const [notification, setNotification] = useState<{ message: string; type: "success" | "info" } | null>(null)
  const { currentUser } = useAuth()
  const { addNotification } = useNotifications()

  // Load journal entries from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedEntries = localStorage.getItem("idrissSalmaJournal")
      if (savedEntries) {
        setJournalEntries(JSON.parse(savedEntries))
      }
    }
  }, [])

  // Save journal entries to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("idrissSalmaJournal", JSON.stringify(journalEntries))
    }
  }, [journalEntries])

  // Add new journal entry
  const addJournalEntry = (e: React.FormEvent) => {
    e.preventDefault()
    if (newEntry.trim() && currentUser) {
      const entry: JournalEntry = {
        id: Date.now(),
        text: newEntry.trim(),
        author: currentUser.username,
        authorName: currentUser.name,
        timestamp: new Date().toLocaleString(),
        day: selectedDay,
      }

      setJournalEntries((prev) => ({
        ...prev,
        [selectedDay]: {
          ...prev[selectedDay],
          [currentUser.username]: entry,
        },
      }))

      addNotification({
        type: "journal",
        title: "New Journal Entry",
        message: `${currentUser.name} wrote a journal entry for Day ${selectedDay}`,
        fromUser: currentUser.username,
        fromUserName: currentUser.name,
        targetId: `journal_${entry.id}`,
        targetType: "journal",
        icon: "📖",
      })

      setNewEntry("")

      // Show success notification
      setNotification({
        message: `Journal entry saved for Day ${selectedDay}! 📖`,
        type: "success",
      })
    }
  }

  // Get entry for a specific day and user
  const getEntry = (day: number, username: string): JournalEntry | null => {
    return journalEntries[day]?.[username] || null
  }

  // Check if user has written for today
  const hasUserWritten = (day: number, username: string): boolean => {
    return !!getEntry(day, username)
  }

  if (!currentUser) return null

  return (
    <div className="max-w-6xl mx-auto">
      {/* Notification */}
      {notification && (
        <Notification message={notification.message} type={notification.type} onClose={() => setNotification(null)} />
      )}

      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">📖 Daily Journal</h1>
        <p className="text-lg text-gray-600">Share your thoughts and experiences for each day of the challenge</p>
      </div>

      {/* Day Selection */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">Select a Day</h2>
        <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
          {Array.from({ length: 30 }, (_, index) => {
            const day = index + 1
            const hasIdriss = hasUserWritten(day, "idriss")
            const hasSalma = hasUserWritten(day, "salma")

            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`p-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  selectedDay === day
                    ? "bg-gradient-to-r from-pink-400 to-blue-500 text-white shadow-lg"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                }`}
              >
                <div className="text-center">
                  <div className="font-bold">Day {day}</div>
                  <div className="text-xs mt-1">
                    {hasIdriss && <span className="text-pink-500">🌸</span>}
                    {hasSalma && <span className="text-blue-500">💙</span>}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Journal Entry Form */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">Day {selectedDay} - Write Your Entry</h2>

        {hasUserWritten(selectedDay, currentUser.username) ? (
          <div className="text-center p-6 bg-green-50 rounded-xl">
            <div className="text-2xl mb-2">✅</div>
            <p className="text-green-700 font-medium">You've already written for Day {selectedDay}!</p>
            <button
              onClick={() => {
                const updatedEntries = { ...journalEntries }
                if (updatedEntries[selectedDay]) {
                  delete updatedEntries[selectedDay][currentUser.username]
                  setJournalEntries(updatedEntries)
                }
              }}
              className="mt-3 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors duration-200 text-sm"
            >
              🗑️ Delete Entry
            </button>
          </div>
        ) : (
          <form onSubmit={addJournalEntry} className="space-y-4">
            <textarea
              value={newEntry}
              onChange={(e) => setNewEntry(e.target.value)}
              placeholder={`Write about your Day ${selectedDay} experience...`}
              className="w-full h-32 p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200 resize-none"
              required
            />
            <div className="text-center">
              <button
                type="submit"
                disabled={!newEntry.trim()}
                className="bg-gradient-to-r from-pink-400 to-blue-500 hover:from-pink-500 hover:to-blue-600 text-white font-bold py-3 px-8 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ✍️ Save Entry
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Journal Entries Display */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Idriss's Entry */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="text-center mb-4">
            <div className="w-16 h-16 rounded-full mx-auto mb-3 overflow-hidden border-2 border-pink-200">
              <img
                src="/idriss-profile.jpg"
                alt="Idriss's profile"
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  // Fallback to colored initial if image fails
                  target.style.display = "none"
                  const fallback = target.nextSibling as HTMLElement
                  if (fallback) {
                    fallback.style.display = "flex"
                  }
                }}
              />
              <div
                className="w-full h-full bg-pink-100 flex items-center justify-center text-2xl text-pink-600"
                style={{ display: "none" }}
              >
                🌸
              </div>
            </div>
            <h3 className="text-xl font-bold text-pink-700">Idriss's Entry</h3>
          </div>

          {getEntry(selectedDay, "idriss") ? (
            <div className="space-y-3">
              <div className="text-xs text-gray-500 text-center">{getEntry(selectedDay, "idriss")?.timestamp}</div>
              <div className="bg-pink-50 p-4 rounded-xl text-gray-700 leading-relaxed">
                {getEntry(selectedDay, "idriss")?.text}
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <div className="text-2xl mb-2">💭</div>
              <p>Idriss hasn't written for Day {selectedDay} yet</p>
            </div>
          )}
        </div>

        {/* Salma's Entry */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="text-center mb-4">
            <div className="w-16 h-16 rounded-full mx-auto mb-3 overflow-hidden border-2 border-blue-200">
              <img
                src="/salma-profile.jpg"
                alt="Salma's profile"
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  // Fallback to colored initial if image fails
                  target.style.display = "none"
                  const fallback = target.nextSibling as HTMLElement
                  if (fallback) {
                    fallback.style.display = "flex"
                  }
                }}
              />
              <div
                className="w-full h-full bg-blue-100 flex items-center justify-center text-2xl text-blue-600"
                style={{ display: "none" }}
              >
                💙
              </div>
            </div>
            <h3 className="text-xl font-bold text-blue-700">Salma's Entry</h3>
          </div>

          {getEntry(selectedDay, "salma") ? (
            <div className="space-y-3">
              <div className="text-xs text-gray-500 text-center">{getEntry(selectedDay, "salma")?.timestamp}</div>
              <div className="bg-blue-50 p-4 rounded-xl text-gray-700 leading-relaxed">
                {getEntry(selectedDay, "salma")?.text}
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <div className="text-2xl mb-2">💭</div>
              <p>Salma hasn't written for Day {selectedDay} yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Journal
