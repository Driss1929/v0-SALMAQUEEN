import { io, type Socket } from "socket.io-client"

class SocketManager {
  private socket: Socket | null = null
  private currentUser: string | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private connectionStatus: "connected" | "connecting" | "disconnected" | "error" = "disconnected"
  private statusCallbacks: ((status: string) => void)[] = []
  private messageQueue: any[] = []

  connect(username: string) {
    if (this.socket?.connected && this.currentUser === username) {
      return this.socket
    }

    this.disconnect()
    this.currentUser = username
    this.setConnectionStatus("connecting")

    this.socket = io({
      path: "/api/socket",
      addTrailingSlash: false,
      timeout: 10000,
      forceNew: true,
      transports: ["websocket", "polling"],
      upgrade: true,
      rememberUpgrade: true,
    })

    this.socket.on("connect", () => {
      console.log("[v0] Socket.io connected")
      this.setConnectionStatus("connected")
      this.reconnectAttempts = 0
      this.socket?.emit("user:join", username)

      this.processMessageQueue()
    })

    this.socket.on("disconnect", (reason) => {
      console.log("[v0] Socket.io disconnected:", reason)
      this.setConnectionStatus("disconnected")

      // Auto-reconnect if disconnected unexpectedly
      if (reason === "io server disconnect") {
        // Server initiated disconnect, don't reconnect
        return
      }

      this.attemptReconnect()
    })

    this.socket.on("connect_error", (error) => {
      console.error("[v0] Socket.io connection error:", error)
      this.setConnectionStatus("error")
      this.attemptReconnect()
    })

    return this.socket
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts && this.currentUser) {
      this.reconnectAttempts++
      console.log(`[v0] Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)

      setTimeout(() => {
        if (this.currentUser) {
          this.connect(this.currentUser)
        }
      }, this.reconnectDelay * this.reconnectAttempts)
    }
  }

  private setConnectionStatus(status: "connected" | "connecting" | "disconnected" | "error") {
    this.connectionStatus = status
    this.statusCallbacks.forEach((callback) => callback(status))
  }

  onConnectionStatusChange(callback: (status: string) => void) {
    this.statusCallbacks.push(callback)
    // Immediately call with current status
    callback(this.connectionStatus)
  }

  getConnectionStatus() {
    return this.connectionStatus
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      this.currentUser = null
      this.setConnectionStatus("disconnected")
    }
  }

  getSocket() {
    return this.socket
  }

  isConnected() {
    return this.socket?.connected || false
  }

  sendMessage(
    data: {
      sender_username: string
      receiver_username: string
      content?: string
      message_type: string
      media_url?: string
      media_name?: string
      media_size?: number
    },
    retryCount = 0,
  ) {
    if (!this.isConnected()) {
      this.messageQueue.push({ data, retryCount })

      if (retryCount < 3) {
        // Try to reconnect
        if (this.currentUser) {
          this.connect(this.currentUser)
        }

        setTimeout(
          () => {
            this.sendMessage(data, retryCount + 1)
          },
          1000 * (retryCount + 1),
        )
      }
      return
    }

    this.socket?.emit("message:send", data)
  }

  private processMessageQueue() {
    if (this.messageQueue.length > 0) {
      console.log(`[v0] Processing ${this.messageQueue.length} queued messages`)

      const queue = [...this.messageQueue]
      this.messageQueue = []

      queue.forEach(({ data }) => {
        this.socket?.emit("message:send", data)
      })
    }
  }

  // Message methods with retry logic
  onMessageReceive(callback: (message: any) => void) {
    this.socket?.on("message:receive", callback)
  }

  onMessageDelivered(callback: (data: { messageId: string }) => void) {
    this.socket?.on("message:delivered", callback)
  }

  onMessageRead(callback: (data: { messageId: string }) => void) {
    this.socket?.on("message:read", callback)
  }

  markMessageAsRead(messageId: string, currentUser: string) {
    this.socket?.emit("message:read", { messageId, currentUser })
  }

  // Bulk mark messages as read
  markAllMessagesAsRead(currentUser: string, otherUser: string) {
    this.socket?.emit("messages:mark-all-read", { currentUser, otherUser })
  }

  // Typing methods
  startTyping(receiver: string) {
    if (this.currentUser) {
      this.socket?.emit("typing:start", { username: this.currentUser, receiver })
    }
  }

  stopTyping(receiver: string) {
    if (this.currentUser) {
      this.socket?.emit("typing:stop", { username: this.currentUser, receiver })
    }
  }

  onTypingStart(callback: (data: { username: string }) => void) {
    this.socket?.on("typing:start", callback)
  }

  onTypingStop(callback: (data: { username: string }) => void) {
    this.socket?.on("typing:stop", callback)
  }

  // User status methods
  onUserOnline(callback: (data: { username: string; isOnline: boolean }) => void) {
    this.socket?.on("user:online", callback)
  }

  onUserOffline(callback: (data: { username: string; isOnline: boolean }) => void) {
    this.socket?.on("user:offline", callback)
  }

  // Error handling
  onMessageError(callback: (error: { error: string }) => void) {
    this.socket?.on("message:error", callback)
  }

  // Sync methods for offline support
  requestMessageSync(currentUser: string, otherUser: string, lastSyncTime?: string) {
    this.socket?.emit("messages:sync", { currentUser, otherUser, lastSyncTime })
  }

  onMessageSync(callback: (data: { messages: any[] }) => void) {
    this.socket?.on("messages:sync", callback)
  }

  removeAllListeners() {
    this.socket?.removeAllListeners()
    this.statusCallbacks = []
    this.messageQueue = []
  }
}

// Export singleton instance
export const socketManager = new SocketManager()
