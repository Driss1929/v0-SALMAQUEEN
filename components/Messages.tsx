"use client"
import { useState, useEffect, useRef } from "react"
import type React from "react"

import { useAuth } from "../contexts/AuthContext"
import { socketManager } from "../lib/socket"

interface Message {
  id: string
  sender_username: string
  receiver_username: string
  content?: string
  message_type: "text" | "image" | "voice" | "video" | "document"
  media_url?: string
  media_name?: string
  media_size?: number
  is_read: boolean
  delivered_at?: string
  read_at?: string
  created_at: string
  reactions?: { [emoji: string]: string[] }
}

interface MediaPreview {
  type: "image" | "video" | "document"
  url: string
  name?: string
}

function Messages() {
  const { currentUser } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [otherUserOnline, setOtherUserOnline] = useState(false)
  const [lastSeen, setLastSeen] = useState<string>("")
  const [isTyping, setIsTyping] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<string>("disconnected")
  const [unreadCount, setUnreadCount] = useState(0)
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" | "received" } | null>(
    null,
  )
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showMediaPreview, setShowMediaPreview] = useState(false)
  const [previewMedia, setPreviewMedia] = useState<MediaPreview | null>(null)
  const [previewCaption, setPreviewCaption] = useState("")
  const [showFullScreenMedia, setShowFullScreenMedia] = useState<string | null>(null)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const emojiPickerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const documentInputRef = useRef<HTMLInputElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [isRecording, setIsRecording] = useState(false)

  useEffect(() => {
    if (currentUser) {
      // Connect to Socket.io
      const socket = socketManager.connect(currentUser.username)

      // Monitor connection status
      socketManager.onConnectionStatusChange((status) => {
        setConnectionStatus(status)
        if (status === "connected") {
          // Sync messages when reconnected
          const otherUsername = currentUser.username === "idriss" ? "salma" : "idriss"
          socketManager.requestMessageSync(currentUser.username, otherUsername)
        }
      })

      // Load existing messages
      loadMessages()
      loadUnreadCount()

      // Set up Socket.io event listeners
      socketManager.onMessageReceive((message: Message) => {
        console.log("[v0] Received message:", message)
        setMessages((prev) => {
          // Avoid duplicates
          if (prev.find((m) => m.id === message.id)) {
            return prev
          }
          return [...prev, message]
        })

        // Mark message as read if chat is open
        if (message.sender_username !== currentUser.username) {
          socketManager.markMessageAsRead(message.id, currentUser.username)
          setUnreadCount((prev) => Math.max(0, prev - 1))
        }

        setNotification({
          message: "New message received!",
          type: "received",
        })
      })

      socketManager.onMessageDelivered((data) => {
        console.log("[v0] Message delivered:", data.messageId)
        setMessages((prev) =>
          prev.map((msg) => (msg.id === data.messageId ? { ...msg, delivered_at: new Date().toISOString() } : msg)),
        )
      })

      socketManager.onMessageRead((data) => {
        console.log("[v0] Message read:", data.messageId)
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === data.messageId ? { ...msg, is_read: true, read_at: new Date().toISOString() } : msg,
          ),
        )
      })

      socketManager.onMessageSync((data) => {
        console.log("[v0] Messages synced:", data.messages.length)
        setMessages(data.messages)
      })

      socketManager.onTypingStart((data) => {
        if (data.username !== currentUser.username) {
          setIsTyping(true)
        }
      })

      socketManager.onTypingStop((data) => {
        if (data.username !== currentUser.username) {
          setIsTyping(false)
        }
      })

      socketManager.onUserOnline((data) => {
        if (data.username !== currentUser.username) {
          setOtherUserOnline(true)
          setLastSeen("")
        }
      })

      socketManager.onUserOffline((data) => {
        if (data.username !== currentUser.username) {
          setOtherUserOnline(false)
          setLastSeen("Just now")
        }
      })

      socketManager.onMessageError((error) => {
        let errorMessage = error.error

        if (errorMessage.includes("Network connection failed")) {
          errorMessage = "Network error: Please check your internet connection and try again."
        } else if (errorMessage.includes("timeout")) {
          errorMessage = "Request timed out. Please try sending your message again."
        } else if (errorMessage.includes("Failed to send")) {
          errorMessage = "Message failed to send. Please try again."
        }

        setNotification({
          message: errorMessage,
          type: "error",
        })
      })

      // Check other user status
      checkOtherUserStatus()

      // Mark all messages as read when opening chat
      const otherUsername = currentUser.username === "idriss" ? "salma" : "idriss"
      markAllMessagesAsRead(otherUsername)

      return () => {
        socketManager.removeAllListeners()
        socketManager.disconnect()
      }
    }
  }, [currentUser])

  const loadMessages = async () => {
    if (!currentUser) return

    try {
      const otherUsername = currentUser.username === "idriss" ? "salma" : "idriss"
      const response = await fetch(`/api/messages?currentUser=${currentUser.username}&otherUser=${otherUsername}`)

      if (response.ok) {
        const { messages } = await response.json()
        setMessages(messages || [])
      }
    } catch (error) {
      console.error("[v0] Error loading messages:", error)
    }
  }

  const loadUnreadCount = async () => {
    if (!currentUser) return

    try {
      const response = await fetch(`/api/messages/unread?currentUser=${currentUser.username}`)
      if (response.ok) {
        const { unreadCount } = await response.json()
        setUnreadCount(unreadCount)
      }
    } catch (error) {
      console.error("[v0] Error loading unread count:", error)
    }
  }

  const markAllMessagesAsRead = async (otherUsername: string) => {
    if (!currentUser) return

    try {
      const response = await fetch("/api/messages/mark-all-read", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentUser: currentUser.username, otherUser: otherUsername }),
      })

      if (response.ok) {
        setUnreadCount(0)
        // Update local messages
        setMessages((prev) =>
          prev.map((msg) =>
            msg.sender_username === otherUsername && !msg.is_read
              ? { ...msg, is_read: true, read_at: new Date().toISOString() }
              : msg,
          ),
        )
      }
    } catch (error) {
      console.error("[v0] Error marking messages as read:", error)
    }
  }

  const checkOtherUserStatus = async () => {
    if (!currentUser) return

    try {
      const otherUsername = currentUser.username === "idriss" ? "salma" : "idriss"
      const response = await fetch(`/api/users/${otherUsername}/status`)

      if (response.ok) {
        const { user } = await response.json()
        setOtherUserOnline(user.is_online)

        if (!user.is_online && user.last_seen) {
          const lastSeenTime = new Date(user.last_seen)
          const now = new Date()
          const diffMs = now.getTime() - lastSeenTime.getTime()
          const diffMins = Math.floor(diffMs / (1000 * 60))

          if (diffMins < 1) {
            setLastSeen("Just now")
          } else if (diffMins < 60) {
            setLastSeen(`${diffMins}m ago`)
          } else {
            const diffHours = Math.floor(diffMins / 60)
            setLastSeen(`${diffHours}h ago`)
          }
        }
      }
    } catch (error) {
      console.error("[v0] Error checking user status:", error)
    }
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [notification])

  const handleTyping = () => {
    if (!currentUser) return

    const otherUsername = currentUser.username === "idriss" ? "salma" : "idriss"
    socketManager.startTyping(otherUsername)

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    typingTimeoutRef.current = setTimeout(() => {
      socketManager.stopTyping(otherUsername)
    }, 1000)
  }

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (newMessage.trim() && currentUser) {
      const otherUsername = currentUser.username === "idriss" ? "salma" : "idriss"

      if (connectionStatus === "disconnected" || connectionStatus === "error") {
        setNotification({
          message: "Connection lost. Reconnecting...",
          type: "error",
        })

        // Try to reconnect
        socketManager.connect(currentUser.username)

        // Wait a moment before sending
        setTimeout(() => {
          if (socketManager.isConnected()) {
            socketManager.sendMessage({
              sender_username: currentUser.username,
              receiver_username: otherUsername,
              content: newMessage.trim(),
              message_type: "text",
            })
            setNewMessage("")
          } else {
            setNotification({
              message: "Unable to reconnect. Please refresh the page and try again.",
              type: "error",
            })
          }
        }, 1000)
        return
      }

      socketManager.sendMessage({
        sender_username: currentUser.username,
        receiver_username: otherUsername,
        content: newMessage.trim(),
        message_type: "text",
      })

      setNewMessage("")

      setNotification({
        message: "Message sent!",
        type: "success",
      })
    }
  }

  const sendMediaMessage = () => {
    if (previewMedia && currentUser) {
      const otherUsername = currentUser.username === "idriss" ? "salma" : "idriss"

      socketManager.sendMessage({
        sender_username: currentUser.username,
        receiver_username: otherUsername,
        content: previewCaption.trim() || `${previewMedia.type} from ${currentUser.name}`,
        message_type: previewMedia.type,
        media_url: previewMedia.url,
        media_name: previewMedia.name,
      })

      setNotification({
        message: `${previewMedia.type.charAt(0).toUpperCase() + previewMedia.type.slice(1)} sent successfully!`,
        type: "success",
      })

      setShowMediaPreview(false)
      setPreviewMedia(null)
      setPreviewCaption("")
    }
  }

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      const chunks: BlobPart[] = []

      recorder.ondataavailable = (e) => chunks.push(e.data)
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/wav" })
        const reader = new FileReader()
        reader.onload = () => {
          if (currentUser) {
            const otherUsername = currentUser.username === "idriss" ? "salma" : "idriss"

            socketManager.sendMessage({
              sender_username: currentUser.username,
              receiver_username: otherUsername,
              message_type: "voice",
              media_url: reader.result as string,
            })

            setNotification({
              message: "Voice message sent!",
              type: "success",
            })
          }
        }
        reader.readAsDataURL(blob)
        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorderRef.current = recorder
      recorder.start()
      setIsRecording(true)
      setRecordingDuration(0)

      recordingIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1)
      }, 1000)
    } catch (error) {
      console.error("Error starting voice recording:", error)
      setNotification({
        message: "Could not access microphone",
        type: "error",
      })
    }
  }

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
      }
    }
  }

  const handleReaction = (messageId: string, emoji: string) => {
    if (!currentUser) return

    const updatedMessages = messages.map((message) => {
      if (message.id === messageId) {
        const reactions = { ...message.reactions }
        if (!reactions[emoji]) {
          reactions[emoji] = []
        }

        if (reactions[emoji].includes(currentUser.username)) {
          reactions[emoji] = reactions[emoji].filter((user) => user !== currentUser.username)
          if (reactions[emoji].length === 0) {
            delete reactions[emoji]
          }
        } else {
          reactions[emoji].push(currentUser.username)
        }

        return { ...message, reactions }
      }
      return message
    })

    setMessages(updatedMessages)
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const renderMessage = (message: Message) => {
    const isOwn = message.sender_username === currentUser?.username

    return (
      <div key={message.id} className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-4`}>
        <div className={`max-w-xs lg:max-w-md relative group`}>
          {/* Message Bubble */}
          <div
            className={`px-4 py-2 rounded-2xl relative ${
              isOwn
                ? "bg-blue-500 text-white rounded-br-md"
                : "bg-white text-gray-800 border border-gray-200 rounded-bl-md"
            }`}
          >
            {/* Message Content */}
            {message.message_type === "text" && <p className="break-words">{message.content}</p>}

            {message.message_type === "image" && (
              <div>
                {message.content && message.content !== `image from ${currentUser?.name}` && (
                  <p className="mb-2 break-words">{message.content}</p>
                )}
                <img
                  src={message.media_url || "/placeholder.svg"}
                  alt="Shared image"
                  className="max-w-full h-auto rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => setShowFullScreenMedia(message.media_url || "")}
                />
              </div>
            )}

            {message.message_type === "video" && (
              <div>
                {message.content && message.content !== `video from ${currentUser?.name}` && (
                  <p className="mb-2 break-words">{message.content}</p>
                )}
                <video
                  src={message.media_url}
                  controls
                  className="max-w-full h-auto rounded-lg"
                  style={{ maxHeight: "200px" }}
                />
              </div>
            )}

            {message.message_type === "voice" && (
              <div className="flex items-center gap-2">
                <audio src={message.media_url} controls className="max-w-full" />
                <span className="text-xs opacity-75">Voice</span>
              </div>
            )}

            {message.message_type === "document" && (
              <div>
                {message.content && message.content !== `document from ${currentUser?.name}` && (
                  <p className="mb-2 break-words">{message.content}</p>
                )}
                <div className="flex items-center gap-2 p-2 bg-gray-100 rounded-lg">
                  <span className="text-2xl">📄</span>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{message.media_name}</p>
                    <a
                      href={message.media_url}
                      download={message.media_name}
                      className="text-blue-500 hover:text-blue-700 text-sm"
                    >
                      Download
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* Message Tail */}
            <div
              className={`absolute top-0 w-0 h-0 ${
                isOwn
                  ? "right-0 translate-x-1 border-l-8 border-l-blue-500 border-t-8 border-t-transparent"
                  : "left-0 -translate-x-1 border-r-8 border-r-white border-t-8 border-t-transparent"
              }`}
            />
          </div>

          {/* Reactions */}
          {message.reactions && Object.keys(message.reactions).length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {Object.entries(message.reactions).map(([emoji, users]) => (
                <button
                  key={emoji}
                  onClick={() => handleReaction(message.id, emoji)}
                  className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-colors ${
                    users.includes(currentUser?.username || "")
                      ? "bg-blue-100 text-blue-800"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  <span>{emoji}</span>
                  <span>{users.length}</span>
                </button>
              ))}
            </div>
          )}

          {/* Quick Reactions */}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 left-0 flex gap-1 bg-white rounded-full shadow-lg p-1">
            {["❤️", "😂", "👍", "😮", "😢", "😡"].map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleReaction(message.id, emoji)}
                className="hover:bg-gray-100 rounded-full p-1 text-sm transition-colors"
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Timestamp and Enhanced Status */}
          <div className={`text-xs text-gray-500 mt-1 ${isOwn ? "text-right" : "text-left"}`}>
            <p>
              {isOwn ? currentUser?.name : currentUser?.username === "idriss" ? "Salma" : "Idriss"} •
              {new Date(message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              {isOwn && (
                <span className="ml-1">
                  {message.is_read ? (
                    <span
                      className="text-blue-500"
                      title={`Read at ${new Date(message.read_at || "").toLocaleTimeString()}`}
                    >
                      ✓✓
                    </span>
                  ) : message.delivered_at ? (
                    <span
                      className="text-gray-400"
                      title={`Delivered at ${new Date(message.delivered_at).toLocaleTimeString()}`}
                    >
                      ✓
                    </span>
                  ) : (
                    <span className="text-gray-300" title="Sending...">
                      ⏳
                    </span>
                  )}
                </span>
              )}
            </p>
          </div>
        </div>
      </div>
    )
  }

  const renderConnectionStatus = () => {
    const statusConfig = {
      connected: { color: "bg-green-500", text: "Connected" },
      connecting: { color: "bg-yellow-500", text: "Connecting..." },
      disconnected: { color: "bg-red-500", text: "Disconnected" },
      error: { color: "bg-red-500", text: "Connection Error" },
    }

    const config = statusConfig[connectionStatus as keyof typeof statusConfig] || statusConfig.disconnected

    return (
      <div className="flex items-center gap-2 text-sm text-white opacity-75">
        <div className={`w-2 h-2 rounded-full ${config.color}`}></div>
        <span>{config.text}</span>
      </div>
    )
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: "image" | "video" | "document") => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setNotification({
          message: "File size must be less than 10MB",
          type: "error",
        })
        return
      }

      const reader = new FileReader()
      reader.onload = (event) => {
        setPreviewMedia({
          type,
          url: event.target?.result as string,
          name: file.name,
        })
        setShowMediaPreview(true)
      }
      reader.readAsDataURL(file)
    }
  }

  const emojis = ["😀", "😂", "❤️", "👍", "👎", "😮", "😢", "😡", "🎉", "🔥", "💯", "👏"]

  if (!currentUser) return null

  const otherUserName = currentUser.username === "idriss" ? "Salma" : "Idriss"

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <div className="mb-4">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-full shadow-lg hover:shadow-xl transition-all font-medium"
          >
            ← Back
          </button>
        </div>

        {/* Chat Container */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          {/* Chat Header */}
          <div className="bg-gradient-to-r from-pink-500 to-blue-500 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">
                  💬 Chat with {otherUserName}
                  {unreadCount > 0 && (
                    <span className="ml-2 px-2 py-1 bg-red-500 text-white text-xs rounded-full">{unreadCount}</span>
                  )}
                </h2>
                <div className="flex items-center gap-4 mt-1">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${otherUserOnline ? "bg-green-400" : "bg-gray-300"}`}></div>
                    <span className="text-sm text-white opacity-90">
                      {otherUserOnline ? "Online" : lastSeen || "Offline"}
                      {isTyping && otherUserOnline && " • typing..."}
                    </span>
                  </div>
                  {renderConnectionStatus()}
                </div>
              </div>
            </div>
          </div>

          <div className="h-96 overflow-y-auto p-4 bg-gray-50">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="text-6xl mb-4">💬</div>
                  <p className="text-gray-500 text-lg">No messages yet</p>
                  <p className="text-gray-400">Send the first message to start your conversation!</p>
                </div>
              </div>
            ) : (
              messages.map(renderMessage)
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="p-4 border-t border-gray-200 bg-white">
            <form onSubmit={sendMessage} className="flex items-end gap-2">
              {/* Media Buttons */}
              <div className="flex gap-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, "image")}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-gray-500 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-colors"
                  title="Send Image"
                >
                  📷
                </button>

                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  onChange={(e) => handleFileUpload(e, "video")}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => videoInputRef.current?.click()}
                  className="p-2 text-gray-500 hover:text-purple-500 hover:bg-purple-50 rounded-full transition-colors"
                  title="Send Video"
                >
                  🎥
                </button>

                <input
                  ref={documentInputRef}
                  type="file"
                  onChange={(e) => handleFileUpload(e, "document")}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => documentInputRef.current?.click()}
                  className="p-2 text-gray-500 hover:text-green-500 hover:bg-green-50 rounded-full transition-colors"
                  title="Send Document"
                >
                  📄
                </button>
              </div>

              {/* Message Input */}
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value)
                    handleTyping()
                  }}
                  placeholder="Type a message..."
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-full focus:outline-none focus:border-blue-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-yellow-500 transition-colors"
                >
                  😀
                </button>
              </div>

              {/* Send/Voice Button */}
              {newMessage.trim() ? (
                <button
                  type="submit"
                  className="p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-full transition-colors"
                  title="Send Message"
                >
                  ➤
                </button>
              ) : (
                <button
                  type="button"
                  onMouseDown={startVoiceRecording}
                  onMouseUp={stopVoiceRecording}
                  onMouseLeave={stopVoiceRecording}
                  className={`p-3 rounded-full transition-colors ${
                    isRecording
                      ? "bg-red-500 hover:bg-red-600 text-white animate-pulse"
                      : "bg-gray-500 hover:bg-gray-600 text-white"
                  }`}
                  title={isRecording ? `Recording... ${formatDuration(recordingDuration)}` : "Hold to Record Voice"}
                >
                  🎤
                </button>
              )}
            </form>

            {/* Emoji Picker */}
            {showEmojiPicker && (
              <div ref={emojiPickerRef} className="absolute bottom-20 right-4 bg-white rounded-2xl shadow-xl p-4 z-10">
                <div className="grid grid-cols-6 gap-2">
                  {emojis.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => {
                        setNewMessage((prev) => prev + emoji)
                        setShowEmojiPicker(false)
                      }}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-xl"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Media Preview Modal */}
        {showMediaPreview && previewMedia && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Send {previewMedia.type}</h3>
                <button
                  onClick={() => setShowMediaPreview(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="mb-4">
                {previewMedia.type === "image" && (
                  <img
                    src={previewMedia.url || "/placeholder.svg"}
                    alt="Preview"
                    className="w-full max-h-64 object-cover rounded-lg"
                  />
                )}
                {previewMedia.type === "video" && (
                  <video src={previewMedia.url} controls className="w-full max-h-64 object-cover rounded-lg" />
                )}
                {previewMedia.type === "document" && (
                  <div className="flex items-center gap-3 p-4 bg-gray-100 rounded-lg">
                    <span className="text-3xl">📄</span>
                    <div>
                      <p className="font-medium">{previewMedia.name}</p>
                      <p className="text-sm text-gray-600">Document</p>
                    </div>
                  </div>
                )}
              </div>

              <textarea
                value={previewCaption}
                onChange={(e) => setPreviewCaption(e.target.value)}
                placeholder="Add a caption..."
                className="w-full p-3 border border-gray-300 rounded-lg resize-none mb-4"
                rows={3}
              />

              <div className="flex gap-3">
                <button
                  onClick={() => setShowMediaPreview(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={sendMediaMessage}
                  className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Full Screen Media Modal */}
        {showFullScreenMedia && (
          <div
            className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
            onClick={() => setShowFullScreenMedia(null)}
          >
            <img
              src={showFullScreenMedia || "/placeholder.svg"}
              alt="Full screen"
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={() => setShowFullScreenMedia(null)}
              className="absolute top-4 right-4 text-white text-3xl hover:text-gray-300 transition-colors"
            >
              ×
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Messages
