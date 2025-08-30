"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { formatDistanceToNow } from "date-fns"

interface LikedByUser {
  user_username: string
  created_at: string
  app_users: {
    username: string
    display_name: string
    profile_picture_url?: string
    is_online: boolean
  }
}

interface LikedByModalProps {
  isOpen: boolean
  onClose: () => void
  postId?: string
  commentId?: string
  title: string
}

export default function LikedByModal({ isOpen, onClose, postId, commentId, title }: LikedByModalProps) {
  const [likedByUsers, setLikedByUsers] = useState<LikedByUser[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (isOpen && (postId || commentId)) {
      fetchLikedByUsers()
    }
  }, [isOpen, postId, commentId])

  const fetchLikedByUsers = async () => {
    setIsLoading(true)
    let query = supabase
      .from("likes")
      .select(`
        user_username,
        created_at,
        app_users!likes_user_username_fkey (
          username,
          display_name,
          profile_picture_url,
          is_online
        )
      `)
      .order("created_at", { ascending: false })

    if (postId) {
      query = query.eq("post_id", postId)
    } else if (commentId) {
      query = query.eq("comment_id", commentId)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching liked by users:", error)
    } else {
      setLikedByUsers(data || [])
    }
    setIsLoading(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {likedByUsers.length} {likedByUsers.length === 1 ? "person likes" : "people like"} this
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-96">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="text-sm text-muted-foreground">Loading...</div>
            </div>
          ) : likedByUsers.length > 0 ? (
            <div className="space-y-3">
              {likedByUsers.map((like) => (
                <div key={like.user_username} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={like.app_users.profile_picture_url || "/placeholder.svg"} />
                        <AvatarFallback>
                          {like.app_users.display_name?.[0] || like.app_users.username[0]}
                        </AvatarFallback>
                      </Avatar>
                      {like.app_users.is_online && (
                        <div className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{like.app_users.display_name}</p>
                      <p className="text-xs text-muted-foreground">@{like.app_users.username}</p>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(like.created_at))} ago
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">No likes yet</p>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
