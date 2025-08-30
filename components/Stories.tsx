"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useAuth } from "../contexts/AuthContext"

interface Story {
  id: number
  userId: string
  userName: string
  userColor: string
  mediaUrl: string
  mediaType: "image" | "video"
  text?: string
  timestamp: number
  expiresAt: number
  viewed: string[] // Array of usernames who viewed the story
}

interface StoryViewerProps {
  stories: Story[]
  currentStoryIndex: number
  onClose: () => void
  onNext: () => void
  onPrevious: () => void
  currentUser: any
}

function StoryViewer({ stories, currentStoryIndex, onClose, onNext, onPrevious, currentUser }: StoryViewerProps) {
  const [progress, setProgress] = useState(0)
  const [isPaused, setPaused] = useState(false)
  const progressInterval = useRef<NodeJS.Timeout>()

  const currentStory = stories[currentStoryIndex]

  useEffect(() => {
    if (!isPaused && currentStory) {
      progressInterval.current = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            onNext()
            return 0
          }
          return prev + 1
        })
      }, 50) // 5 second duration (100 * 50ms)

      return () => {
        if (progressInterval.current) {
          clearInterval(progressInterval.current)
        }
      }
    }
  }, [currentStoryIndex, isPaused, onNext])

  useEffect(() => {
    setProgress(0)

    // Mark story as viewed
    if (currentStory && currentUser && !currentStory.viewed.includes(currentUser.username)) {
      const updatedStories = JSON.parse(localStorage.getItem("idrissSalmaStories") || "[]")
      const storyIndex = updatedStories.findIndex((s: Story) => s.id === currentStory.id)
      if (storyIndex !== -1) {
        updatedStories[storyIndex].viewed.push(currentUser.username)
        localStorage.setItem("idrissSalmaStories", JSON.stringify(updatedStories))
      }
    }
  }, [currentStoryIndex, currentStory, currentUser])

  if (!currentStory) return null

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      {/* Progress bars */}
      <div className="absolute top-4 left-4 right-4 flex gap-1 z-10">
        {stories.map((_, index) => (
          <div key={index} className="flex-1 h-1 bg-gray-600 rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-100"
              style={{
                width: index < currentStoryIndex ? "100%" : index === currentStoryIndex ? `${progress}%` : "0%",
              }}
            />
          </div>
        ))}
      </div>

      {/* Story header */}
      <div className="absolute top-8 left-4 right-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
              currentStory.userColor === "pink" ? "bg-pink-500" : "bg-blue-500"
            }`}
          >
            {currentStory.userName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="text-white font-semibold">{currentStory.userName}</div>
            <div className="text-gray-300 text-sm">
              {new Date(currentStory.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </div>
          </div>
        </div>
        <button onClick={onClose} className="text-white text-2xl hover:text-gray-300">
          ×
        </button>
      </div>

      {/* Story content */}
      <div className="relative w-full h-full flex items-center justify-center" onClick={() => setPaused(!isPaused)}>
        {currentStory.mediaType === "image" ? (
          <img
            src={currentStory.mediaUrl || "/placeholder.svg"}
            alt="Story content"
            className="max-w-full max-h-full object-contain"
          />
        ) : (
          <video src={currentStory.mediaUrl} className="max-w-full max-h-full object-contain" autoPlay muted loop />
        )}

        {currentStory.text && (
          <div className="absolute bottom-20 left-4 right-4 text-center">
            <div className="bg-black bg-opacity-50 text-white px-4 py-2 rounded-lg inline-block">
              {currentStory.text}
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <button
        onClick={onPrevious}
        className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white text-2xl hover:text-gray-300"
        disabled={currentStoryIndex === 0}
      >
        ‹
      </button>
      <button
        onClick={onNext}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white text-2xl hover:text-gray-300"
        disabled={currentStoryIndex === stories.length - 1}
      >
        ›
      </button>

      {/* Pause indicator */}
      {isPaused && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-4xl">
          ⏸️
        </div>
      )}
    </div>
  )
}

function Stories() {
  const [stories, setStories] = useState<Story[]>([])
  const [showViewer, setShowViewer] = useState(false)
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0)
  const [showAddStory, setShowAddStory] = useState(false)
  const [storyText, setStoryText] = useState("")
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null)
  const [mediaType, setMediaType] = useState<"image" | "video">("image")
  const { currentUser } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load stories and clean expired ones
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedStories = localStorage.getItem("idrissSalmaStories")
      if (savedStories) {
        const allStories = JSON.parse(savedStories)
        const now = Date.now()
        const validStories = allStories.filter((story: Story) => story.expiresAt > now)

        if (validStories.length !== allStories.length) {
          localStorage.setItem("idrissSalmaStories", JSON.stringify(validStories))
        }

        setStories(validStories)
      }
    }
  }, [])

  // Group stories by user
  const groupedStories = stories.reduce(
    (acc, story) => {
      if (!acc[story.userId]) {
        acc[story.userId] = []
      }
      acc[story.userId].push(story)
      return acc
    },
    {} as Record<string, Story[]>,
  )

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert("File size must be less than 10MB")
        return
      }

      const reader = new FileReader()
      reader.onload = (event) => {
        setSelectedMedia(event.target?.result as string)
        setMediaType(file.type.startsWith("video/") ? "video" : "image")
      }
      reader.readAsDataURL(file)
    }
  }

  const addStory = () => {
    if (selectedMedia && currentUser) {
      const newStory: Story = {
        id: Date.now(),
        userId: currentUser.username,
        userName: currentUser.name,
        userColor: currentUser.color,
        mediaUrl: selectedMedia,
        mediaType,
        text: storyText.trim() || undefined,
        timestamp: Date.now(),
        expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
        viewed: [],
      }

      const updatedStories = [...stories, newStory]
      setStories(updatedStories)
      localStorage.setItem("idrissSalmaStories", JSON.stringify(updatedStories))

      // Reset form
      setSelectedMedia(null)
      setStoryText("")
      setShowAddStory(false)
    }
  }

  const openStoryViewer = (userId: string) => {
    const userStories = groupedStories[userId] || []
    const allStoriesArray = Object.values(groupedStories).flat()
    const startIndex = allStoriesArray.findIndex((story) => story.userId === userId)

    setCurrentStoryIndex(startIndex)
    setShowViewer(true)
  }

  const nextStory = () => {
    const allStoriesArray = Object.values(groupedStories).flat()
    if (currentStoryIndex < allStoriesArray.length - 1) {
      setCurrentStoryIndex(currentStoryIndex + 1)
    } else {
      setShowViewer(false)
    }
  }

  const previousStory = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(currentStoryIndex - 1)
    }
  }

  if (!currentUser) return null

  const allStoriesArray = Object.values(groupedStories).flat()

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">📖 Stories</h1>
          <p className="text-lg text-gray-600">Share moments that disappear in 24 hours</p>
        </div>

        {/* Stories Container */}
        <div className="bg-white rounded-3xl shadow-xl p-6 mb-6">
          {/* Add Story Button */}
          <div className="mb-6">
            <button
              onClick={() => setShowAddStory(true)}
              className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-purple-400 hover:bg-purple-50 transition-all duration-200 flex items-center justify-center gap-2 text-gray-600 hover:text-purple-600"
            >
              <span className="text-2xl">+</span>
              <span className="font-medium">Add Your Story</span>
            </button>
          </div>

          {/* Stories Grid */}
          {Object.keys(groupedStories).length === 0 ? (
            <div className="text-center text-gray-500 py-12">
              <div className="text-4xl mb-4">📱</div>
              <p>No stories yet. Be the first to share a moment!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Object.entries(groupedStories).map(([userId, userStories]) => {
                const latestStory = userStories[userStories.length - 1]
                const hasUnviewed = userStories.some((story) => !story.viewed.includes(currentUser.username))

                return (
                  <div key={userId} onClick={() => openStoryViewer(userId)} className="relative cursor-pointer group">
                    <div
                      className={`relative rounded-xl overflow-hidden aspect-[3/4] ${
                        hasUnviewed ? "ring-4 ring-purple-500" : "ring-2 ring-gray-300"
                      }`}
                    >
                      {latestStory.mediaType === "image" ? (
                        <img
                          src={latestStory.mediaUrl || "/placeholder.svg"}
                          alt={`${latestStory.userName}'s story`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                      ) : (
                        <video
                          src={latestStory.mediaUrl}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          muted
                        />
                      )}

                      {/* User info overlay */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-3">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                              latestStory.userColor === "pink" ? "bg-pink-500" : "bg-blue-500"
                            }`}
                          >
                            {latestStory.userName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-white text-sm font-medium">{latestStory.userName}</div>
                            <div className="text-gray-300 text-xs">
                              {userStories.length} {userStories.length === 1 ? "story" : "stories"}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Add Story Modal */}
        {showAddStory && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full">
              <h3 className="text-xl font-bold mb-4">Add New Story</h3>

              {!selectedMedia ? (
                <div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-8 border-2 border-dashed border-gray-300 rounded-xl hover:border-purple-400 hover:bg-purple-50 transition-all duration-200 flex flex-col items-center gap-2"
                  >
                    <span className="text-4xl">📷</span>
                    <span className="font-medium text-gray-600">Choose Photo or Video</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleMediaUpload}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative rounded-xl overflow-hidden">
                    {mediaType === "image" ? (
                      <img
                        src={selectedMedia || "/placeholder.svg"}
                        alt="Story preview"
                        className="w-full h-48 object-cover"
                      />
                    ) : (
                      <video src={selectedMedia} className="w-full h-48 object-cover" controls />
                    )}
                  </div>

                  <textarea
                    value={storyText}
                    onChange={(e) => setStoryText(e.target.value)}
                    placeholder="Add a caption..."
                    className="w-full p-3 border border-gray-300 rounded-lg resize-none"
                    rows={3}
                  />

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setSelectedMedia(null)
                        setStoryText("")
                      }}
                      className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Change Media
                    </button>
                    <button
                      onClick={addStory}
                      className="flex-1 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg"
                    >
                      Share Story
                    </button>
                  </div>
                </div>
              )}

              <button
                onClick={() => {
                  setShowAddStory(false)
                  setSelectedMedia(null)
                  setStoryText("")
                }}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-xl"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Story Viewer */}
        {showViewer && allStoriesArray.length > 0 && (
          <StoryViewer
            stories={allStoriesArray}
            currentStoryIndex={currentStoryIndex}
            onClose={() => setShowViewer(false)}
            onNext={nextStory}
            onPrevious={previousStory}
            currentUser={currentUser}
          />
        )}
      </div>
    </div>
  )
}

export default Stories
