"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Heart, Reply, MoreHorizontal, Edit, Trash2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { formatDistanceToNow } from "date-fns"
import ReactMarkdown from "react-markdown"

interface Comment {
  id: string
  content: string
  author_username: string
  post_id: string
  parent_comment_id?: string
  likes_count: number
  created_at: string
  updated_at: string
  app_users?: {
    username: string
    display_name: string
    profile_picture_url?: string
  }
  replies?: Comment[]
}

interface User {
  id: string
  username: string
  display_name: string
  profile_picture_url?: string
}

interface CommentsSectionProps {
  postId: string
  commentsCount: number
  onCommentsCountChange: (count: number) => void
}

export default function CommentsSection({ postId, commentsCount, onCommentsCountChange }: CommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState("")
  const [editingComment, setEditingComment] = useState<string | null>(null)
  const [editContent, setEditContent] = useState("")
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCommenting, setIsCommenting] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchUser()
    fetchComments()
  }, [postId])

  const fetchUser = async () => {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()
    if (authUser) {
      const { data: userData } = await supabase.from("app_users").select("*").eq("id", authUser.id).single()
      if (userData) {
        setUser({
          id: userData.id,
          username: userData.username,
          display_name: userData.display_name,
          profile_picture_url: userData.profile_picture_url,
        })
      }
    }
  }

  const fetchComments = async () => {
    setIsLoading(true)
    const { data, error } = await supabase
      .from("comments")
      .select(`
        *,
        app_users!comments_author_username_fkey (
          username,
          display_name,
          profile_picture_url
        )
      `)
      .eq("post_id", postId)
      .order("created_at", { ascending: true })

    if (error) {
      console.error("Error fetching comments:", error)
    } else {
      // Organize comments into nested structure
      const commentsMap = new Map<string, Comment>()
      const rootComments: Comment[] = []

      // First pass: create all comments
      data?.forEach((comment) => {
        const commentWithReplies = { ...comment, replies: [] }
        commentsMap.set(comment.id, commentWithReplies)
      })

      // Second pass: organize into tree structure
      data?.forEach((comment) => {
        if (comment.parent_comment_id) {
          const parent = commentsMap.get(comment.parent_comment_id)
          if (parent) {
            parent.replies!.push(commentsMap.get(comment.id)!)
          }
        } else {
          rootComments.push(commentsMap.get(comment.id)!)
        }
      })

      setComments(rootComments)
      onCommentsCountChange(data?.length || 0)
    }
    setIsLoading(false)
  }

  const createComment = async (parentId?: string) => {
    const content = parentId ? replyContent : newComment
    if (!content.trim() || !user) return

    setIsCommenting(true)
    const { error } = await supabase.from("comments").insert({
      content,
      author_username: user.username,
      post_id: postId,
      parent_comment_id: parentId || null,
    })

    if (error) {
      console.error("Error creating comment:", error)
    } else {
      if (parentId) {
        setReplyContent("")
        setReplyingTo(null)
      } else {
        setNewComment("")
      }
      fetchComments()
    }
    setIsCommenting(false)
  }

  const updateComment = async (commentId: string) => {
    if (!editContent.trim()) return

    const { error } = await supabase.from("comments").update({ content: editContent }).eq("id", commentId)

    if (error) {
      console.error("Error updating comment:", error)
    } else {
      setEditingComment(null)
      setEditContent("")
      fetchComments()
    }
  }

  const deleteComment = async (commentId: string) => {
    const { error } = await supabase.from("comments").delete().eq("id", commentId)

    if (error) {
      console.error("Error deleting comment:", error)
    } else {
      fetchComments()
    }
  }

  const toggleCommentLike = async (commentId: string) => {
    if (!user) return

    // Check if already liked
    const { data: existingLike } = await supabase
      .from("likes")
      .select("id")
      .eq("comment_id", commentId)
      .eq("user_username", user.username)
      .single()

    if (existingLike) {
      // Unlike
      await supabase.from("likes").delete().eq("comment_id", commentId).eq("user_username", user.username)
    } else {
      // Like
      await supabase.from("likes").insert({
        comment_id: commentId,
        user_username: user.username,
      })
    }

    fetchComments()
  }

  const startEdit = (comment: Comment) => {
    setEditingComment(comment.id)
    setEditContent(comment.content)
  }

  const startReply = (commentId: string) => {
    setReplyingTo(commentId)
    setReplyContent("")
  }

  const renderComment = (comment: Comment, depth = 0) => (
    <div key={comment.id} className={`${depth > 0 ? "ml-8 border-l-2 border-muted pl-4" : ""}`}>
      <Card className="mb-3">
        <CardContent className="pt-4">
          <div className="flex items-start space-x-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={comment.app_users?.profile_picture_url || "/placeholder.svg"} />
              <AvatarFallback>{comment.app_users?.display_name?.[0] || comment.author_username[0]}</AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-sm">
                    {comment.app_users?.display_name || comment.author_username}
                  </span>
                  <span className="text-xs text-muted-foreground">@{comment.author_username}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(comment.created_at))} ago
                  </span>
                </div>

                {user?.username === comment.author_username && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => startEdit(comment)}>
                        <Edit className="h-3 w-3 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => deleteComment(comment.id)} className="text-destructive">
                        <Trash2 className="h-3 w-3 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>

              {editingComment === comment.id ? (
                <div className="space-y-2">
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="min-h-[60px] text-sm"
                  />
                  <div className="flex space-x-2">
                    <Button size="sm" onClick={() => updateComment(comment.id)}>
                      Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingComment(null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown>{comment.content}</ReactMarkdown>
                </div>
              )}

              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleCommentLike(comment.id)}
                  className="h-6 px-2 text-xs text-muted-foreground hover:text-red-500"
                >
                  <Heart className="h-3 w-3 mr-1" />
                  {comment.likes_count}
                </Button>

                {depth < 3 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => startReply(comment.id)}
                    className="h-6 px-2 text-xs text-muted-foreground hover:text-blue-500"
                  >
                    <Reply className="h-3 w-3 mr-1" />
                    Reply
                  </Button>
                )}
              </div>

              {replyingTo === comment.id && (
                <div className="space-y-2 mt-3">
                  <Textarea
                    placeholder="Write a reply..."
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    className="min-h-[60px] text-sm"
                  />
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      onClick={() => createComment(comment.id)}
                      disabled={!replyContent.trim() || isCommenting}
                    >
                      {isCommenting ? "Replying..." : "Reply"}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setReplyingTo(null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Render nested replies */}
      {comment.replies?.map((reply) => renderComment(reply, depth + 1))}
    </div>
  )

  if (isLoading) {
    return <div className="text-center py-4 text-sm text-muted-foreground">Loading comments...</div>
  }

  return (
    <div className="space-y-4">
      {/* Add Comment */}
      {user && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-start space-x-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.profile_picture_url || "/placeholder.svg"} />
                <AvatarFallback>{user.display_name?.[0] || user.username[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-3">
                <Textarea
                  placeholder="Write a comment... (Markdown supported)"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="min-h-[80px] resize-none text-sm"
                />
                <div className="flex justify-end">
                  <Button size="sm" onClick={() => createComment()} disabled={!newComment.trim() || isCommenting}>
                    {isCommenting ? "Commenting..." : "Comment"}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Comments List */}
      <div className="space-y-2">
        {comments.length > 0 ? (
          comments.map((comment) => renderComment(comment))
        ) : (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-sm text-muted-foreground">No comments yet. Be the first to comment!</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
