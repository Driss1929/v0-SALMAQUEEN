import type { NextRequest } from "next/server"
import { Server as ServerIO } from "socket.io"

export const runtime = "nodejs"

// Store for Socket.io server instance
let io: ServerIO | undefined

// Store active users and their socket IDs
const activeUsers = new Map<string, string>()
const userSockets = new Map<string, string>()

async function makeApiCall(url: string, options: RequestInit, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        ...options,
        timeout: 10000, // 10 second timeout
      })

      if (response.ok) {
        return response
      }

      // If it's the last retry or a client error, throw
      if (i === retries - 1 || response.status < 500) {
        throw new Error(`API call failed: ${response.status} ${response.statusText}`)
      }
    } catch (error) {
      console.error(`[v0] API call attempt ${i + 1} failed:`, error)

      // If it's the last retry, throw the error
      if (i === retries - 1) {
        throw error
      }

      // Wait before retrying (exponential backoff)
      await new Promise((resolve) => setTimeout(resolve, Math.pow(2, i) * 1000))
    }
  }

  throw new Error("All retry attempts failed")
}

export async function GET(req: NextRequest) {
  if (!io) {
    // Create HTTP server
    const httpServer = req.socket?.server as any

    if (!httpServer) {
      return new Response("Socket.io server not available", { status: 500 })
    }

    io = new ServerIO(httpServer, {
      path: "/api/socket",
      addTrailingSlash: false,
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    })

    io.on("connection", (socket) => {
      console.log("[v0] Socket connected:", socket.id)

      // Handle user joining
      socket.on("user:join", async (username: string) => {
        console.log("[v0] User joined:", username)
        activeUsers.set(username, socket.id)
        userSockets.set(socket.id, username)

        try {
          const baseUrl = process.env.NEXT_PUBLIC_URL || `http://localhost:3000`
          await makeApiCall(`${baseUrl}/api/users/${username}/status`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ is_online: true, currentUser: username }),
          })
        } catch (error) {
          console.error("[v0] Failed to update user online status:", error)
        }

        // Notify other users that this user is online
        socket.broadcast.emit("user:online", { username, isOnline: true })
      })

      // Handle sending messages
      socket.on(
        "message:send",
        async (data: {
          sender_username: string
          receiver_username: string
          content?: string
          message_type: string
          media_url?: string
          media_name?: string
          media_size?: number
        }) => {
          console.log("[v0] Message send event:", data)

          try {
            const baseUrl = process.env.NEXT_PUBLIC_URL || `http://localhost:3000`
            const response = await makeApiCall(`${baseUrl}/api/messages`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(data),
            })

            const { message } = await response.json()

            // Send message to receiver if they're online
            const receiverSocketId = activeUsers.get(data.receiver_username)
            if (receiverSocketId) {
              io?.to(receiverSocketId).emit("message:receive", message)
            }

            // Confirm delivery to sender
            socket.emit("message:delivered", { messageId: message.id })
          } catch (error) {
            console.error("[v0] Error sending message:", error)
            const errorMessage = error instanceof Error ? error.message : "Failed to send message"
            socket.emit("message:error", {
              error: errorMessage.includes("fetch")
                ? "Network connection failed. Please check your internet connection."
                : errorMessage,
            })
          }
        },
      )

      // Handle typing indicators
      socket.on("typing:start", (data: { username: string; receiver: string }) => {
        const receiverSocketId = activeUsers.get(data.receiver)
        if (receiverSocketId) {
          io?.to(receiverSocketId).emit("typing:start", { username: data.username })
        }
      })

      socket.on("typing:stop", (data: { username: string; receiver: string }) => {
        const receiverSocketId = activeUsers.get(data.receiver)
        if (receiverSocketId) {
          io?.to(receiverSocketId).emit("typing:stop", { username: data.username })
        }
      })

      // Handle message read receipts
      socket.on("message:read", async (data: { messageId: string; currentUser: string }) => {
        try {
          const baseUrl = process.env.NEXT_PUBLIC_URL || `http://localhost:3000`
          const response = await makeApiCall(`${baseUrl}/api/messages/${data.messageId}/read`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ currentUser: data.currentUser }),
          })

          const { message } = await response.json()

          // Notify sender that message was read
          const senderSocketId = activeUsers.get(message.sender_username)
          if (senderSocketId) {
            io?.to(senderSocketId).emit("message:read", { messageId: message.id })
          }
        } catch (error) {
          console.error("[v0] Error marking message as read:", error)
        }
      })

      // Handle user disconnection
      socket.on("disconnect", async () => {
        console.log("[v0] Socket disconnected:", socket.id)
        const username = userSockets.get(socket.id)

        if (username) {
          activeUsers.delete(username)
          userSockets.delete(socket.id)

          try {
            const baseUrl = process.env.NEXT_PUBLIC_URL || `http://localhost:3000`
            await makeApiCall(`${baseUrl}/api/users/${username}/status`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ is_online: false, currentUser: username }),
            })
          } catch (error) {
            console.error("[v0] Failed to update user offline status:", error)
          }

          // Notify other users that this user is offline
          socket.broadcast.emit("user:offline", { username, isOnline: false })
        }
      })
    })
  }

  return new Response("Socket.io server initialized", { status: 200 })
}

export async function POST(req: NextRequest) {
  return GET(req)
}
