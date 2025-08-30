"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Send, MessageCircle, X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface Message {
  id: string
  content: string
  sender_id: string
  receiver_id: string
  created_at: string
  sender: {
    username: string
    avatar_url?: string
  }
}

interface Conversation {
  user_id: string
  username: string
  avatar_url?: string
  last_message?: string
  last_message_time?: string
  unread_count: number
}

export default function MessagingInterface() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    getCurrentUser()
    loadConversations()
  }, [])

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation)
      markMessagesAsRead(selectedConversation)
    }
  }, [selectedConversation])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const getCurrentUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase.from("users").select("*").eq("id", user.id).single()
      setCurrentUser(profile)
    }
  }

  const loadConversations = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from("messages")
      .select(`
        sender_id,
        receiver_id,
        content,
        created_at,
        sender:users!messages_sender_id_fkey(username, avatar_url),
        receiver:users!messages_receiver_id_fkey(username, avatar_url)
      `)
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order("created_at", { ascending: false })

    if (data) {
      const conversationMap = new Map()

      data.forEach((message: any) => {
        const otherUserId = message.sender_id === user.id ? message.receiver_id : message.sender_id
        const otherUser = message.sender_id === user.id ? message.receiver : message.sender

        if (!conversationMap.has(otherUserId)) {
          conversationMap.set(otherUserId, {
            user_id: otherUserId,
            username: otherUser.username,
            avatar_url: otherUser.avatar_url,
            last_message: message.content,
            last_message_time: message.created_at,
            unread_count: 0,
          })
        }
      })

      setConversations(Array.from(conversationMap.values()))
    }
  }

  const loadMessages = async (userId: string) => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from("messages")
      .select(`
        *,
        sender:users!messages_sender_id_fkey(username, avatar_url)
      `)
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${user.id})`)
      .order("created_at", { ascending: true })

    if (data) {
      setMessages(data)
    }
  }

  const markMessagesAsRead = async (userId: string) => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from("messages").update({ read: true }).eq("sender_id", userId).eq("receiver_id", user.id)
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !currentUser) return

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from("messages")
      .insert({
        content: newMessage,
        sender_id: user.id,
        receiver_id: selectedConversation,
      })
      .select(`
        *,
        sender:users!messages_sender_id_fkey(username, avatar_url)
      `)
      .single()

    if (data && !error) {
      setMessages((prev) => [...prev, data])
      setNewMessage("")
      loadConversations() // Refresh conversations
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 rounded-full w-14 h-14 shadow-lg"
        size="icon"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    )
  }

  return (
    <Card className="fixed bottom-4 right-4 w-96 h-[500px] shadow-xl flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold">Messages</h3>
        <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Conversations List */}
        <div className={`${selectedConversation ? "w-1/3" : "w-full"} border-r overflow-y-auto`}>
          {conversations.map((conversation) => (
            <div
              key={conversation.user_id}
              className={`p-3 cursor-pointer hover:bg-muted/50 border-b ${
                selectedConversation === conversation.user_id ? "bg-muted" : ""
              }`}
              onClick={() => setSelectedConversation(conversation.user_id)}
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={conversation.avatar_url || "/placeholder.svg"} />
                  <AvatarFallback>{conversation.username.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{conversation.username}</p>
                  {conversation.last_message && (
                    <p className="text-xs text-muted-foreground truncate">{conversation.last_message}</p>
                  )}
                </div>
                {conversation.unread_count > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {conversation.unread_count}
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Messages */}
        {selectedConversation && (
          <div className="flex-1 flex flex-col">
            {/* Messages List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender_id === currentUser?.id ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.sender_id === currentUser?.id ? "bg-primary text-primary-foreground" : "bg-muted"
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p className="text-xs opacity-70 mt-1">{formatTime(message.created_at)}</p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                  className="flex-1"
                />
                <Button onClick={sendMessage} size="icon">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
