"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Heart, MessageCircle, Share2, MoreHorizontal, Edit, Trash2, Loader2, Flag, Clock } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible"
import { formatDistanceToNow } from "date-fns"
import ReactMarkdown from "react-markdown"
import CommentsSection from "./CommentsSection"
import LikedByModal from "./LikedByModal"
import SearchAndFilter from "./SearchAndFilter"
import ReportModal from "./ReportModal"
import { containsProfanity, filterProfanity, detectSpam, calculateCooldown } from "@/lib/moderation"

interface Post {
  id: string
  content: string
  author_username: string
  created_at: string
  updated_at: string
  likes_count: number
  comments_count: number
  shares_count: number
  post_type: string
  media_url?: string
  media_type?: string
  app_users?: {
    username: string
    display_name: string
    profile_picture_url?: string
  }
}

interface User {
  id: string
  username: string
  display_name: string
  profile_picture_url?: string
}

interface FilterOptions {
  postType?: string
  dateRange?: string
  hasMedia?: boolean
  minLikes?: number
  minComments?: number
}

export default function PostsFeed() {
  const [posts, setPosts] = useState<Post[]>([])
  const [newPost, setNewPost] = useState("")
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isPosting, setIsPosting] = useState(false)
  const [editingPost, setEditingPost] = useState<string | null>(null)
  const [editContent, setEditContent] = useState("")
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set())
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set())
  const [likedByModal, setLikedByModal] = useState<{ isOpen: boolean; postId?: string; title: string }>({
    isOpen: false,
    title: "",
  })
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("created_at_desc")
  const [filters, setFilters] = useState<FilterOptions>({})
  const [hasMore, setHasMore] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [page, setPage] = useState(0)
  const observerRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()
  const [reportModal, setReportModal] = useState<{
    isOpen: boolean
    contentId?: string
    contentType?: "post" | "comment"
    reportedUsername?: string
  }>({ isOpen: false })
  const [lastPostTime, setLastPostTime] = useState<Date | null>(null)
  const [cooldownRemaining, setCooldownRemaining] = useState(0)
  const [moderationWarning, setModerationWarning] = useState("")

  useEffect(() => {
    fetchUser()
    fetchPosts(true)
  }, [])

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
        fetchUserLikes(userData.username)
      }
    }
  }

  const fetchUserLikes = async (username: string) => {
    const { data } = await supabase
      .from("likes")
      .select("post_id")
      .eq("user_username", username)
      .not("post_id", "is", null)

    if (data) {
      setLikedPosts(new Set(data.map((like) => like.post_id)))
    }
  }

  const fetchPosts = useCallback(
    async (reset = false) => {
      if (reset) {
        setIsLoading(true)
        setPage(0)
      } else {
        setIsLoadingMore(true)
      }

      const currentPage = reset ? 0 : page
      const limit = 10
      const offset = currentPage * limit

      let query = supabase.from("posts").select(`
        *,
        app_users!posts_author_username_fkey (
          username,
          display_name,
          profile_picture_url
        )
      `)

      // Apply search
      if (searchQuery.trim()) {
        query = query.ilike("content", `%${searchQuery}%`)
      }

      // Apply filters
      if (filters.postType && filters.postType !== "") {
        if (filters.postType === "text") {
          query = query.is("media_url", null)
        } else if (filters.postType === "image") {
          query = query.like("media_type", "image%")
        } else if (filters.postType === "video") {
          query = query.like("media_type", "video%")
        }
      }

      if (filters.minLikes) {
        query = query.gte("likes_count", filters.minLikes)
      }

      if (filters.minComments) {
        query = query.gte("comments_count", filters.minComments)
      }

      if (filters.dateRange) {
        const now = new Date()
        const startDate = new Date()

        switch (filters.dateRange) {
          case "today":
            startDate.setHours(0, 0, 0, 0)
            break
          case "week":
            startDate.setDate(now.getDate() - 7)
            break
          case "month":
            startDate.setMonth(now.getMonth() - 1)
            break
          case "year":
            startDate.setFullYear(now.getFullYear() - 1)
            break
        }

        if (filters.dateRange !== "") {
          query = query.gte("created_at", startDate.toISOString())
        }
      }

      // Apply sorting
      const [sortField, sortOrder] = sortBy.split("_")
      const ascending = sortOrder === "asc"
      query = query.order(sortField, { ascending })

      // Apply pagination
      query = query.range(offset, offset + limit - 1)

      const { data, error } = await query

      if (error) {
        console.error("Error fetching posts:", error)
      } else {
        const newPosts = data || []

        if (reset) {
          setPosts(newPosts)
        } else {
          setPosts((prev) => [...prev, ...newPosts])
        }

        setHasMore(newPosts.length === limit)
        setPage(currentPage + 1)
      }

      setIsLoading(false)
      setIsLoadingMore(false)
    },
    [searchQuery, sortBy, filters, page],
  )

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore && !isLoading) {
          fetchPosts(false)
        }
      },
      { threshold: 0.1 },
    )

    if (observerRef.current) {
      observer.observe(observerRef.current)
    }

    return () => observer.disconnect()
  }, [fetchPosts, hasMore, isLoadingMore, isLoading])

  useEffect(() => {
    fetchPosts(true)
  }, [searchQuery, sortBy, filters])

  useEffect(() => {
    if (cooldownRemaining > 0) {
      const timer = setInterval(() => {
        setCooldownRemaining((prev) => Math.max(0, prev - 1000))
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [cooldownRemaining])

  const createPost = async () => {
    if (!newPost.trim() || !user) return

    if (containsProfanity(newPost)) {
      setModerationWarning("Your post contains inappropriate language. Please revise your content.")
      return
    }

    if (detectSpam(newPost)) {
      setModerationWarning("Your post appears to be spam. Please create meaningful content.")
      return
    }

    if (lastPostTime) {
      const cooldown = calculateCooldown(lastPostTime)
      if (cooldown > 0) {
        setCooldownRemaining(cooldown)
        setModerationWarning(`Please wait ${Math.ceil(cooldown / 1000)} seconds before posting again.`)
        return
      }
    }

    setModerationWarning("")
    setIsPosting(true)

    const filteredContent = filterProfanity(newPost)

    const { error } = await supabase.from("posts").insert({
      content: filteredContent,
      author_username: user.username,
      post_type: "text",
    })

    if (error) {
      console.error("Error creating post:", error)
      setModerationWarning("Failed to create post. Please try again.")
    } else {
      setNewPost("")
      setLastPostTime(new Date())
      fetchPosts(true)
    }
    setIsPosting(false)
  }

  const updatePost = async (postId: string) => {
    if (!editContent.trim()) return

    if (containsProfanity(editContent)) {
      setModerationWarning("Your edit contains inappropriate language. Please revise your content.")
      return
    }

    if (detectSpam(editContent)) {
      setModerationWarning("Your edit appears to be spam. Please create meaningful content.")
      return
    }

    setModerationWarning("")
    const filteredContent = filterProfanity(editContent)

    const { error } = await supabase.from("posts").update({ content: filteredContent }).eq("id", postId)

    if (error) {
      console.error("Error updating post:", error)
    } else {
      setEditingPost(null)
      setEditContent("")
      fetchPosts(true)
    }
  }

  const deletePost = async (postId: string) => {
    const { error } = await supabase.from("posts").delete().eq("id", postId)

    if (error) {
      console.error("Error deleting post:", error)
    } else {
      fetchPosts(true)
    }
  }

  const toggleLike = async (postId: string) => {
    if (!user) return

    const isCurrentlyLiked = likedPosts.has(postId)

    const newLikedPosts = new Set(likedPosts)
    if (isCurrentlyLiked) {
      newLikedPosts.delete(postId)
    } else {
      newLikedPosts.add(postId)
    }
    setLikedPosts(newLikedPosts)

    setPosts((prevPosts) =>
      prevPosts.map((post) =>
        post.id === postId
          ? {
              ...post,
              likes_count: isCurrentlyLiked ? Math.max(0, post.likes_count - 1) : post.likes_count + 1,
            }
          : post,
      ),
    )

    try {
      if (isCurrentlyLiked) {
        await supabase.from("likes").delete().eq("post_id", postId).eq("user_username", user.username)
      } else {
        await supabase.from("likes").insert({
          post_id: postId,
          user_username: user.username,
        })
      }
    } catch (error) {
      console.error("Error toggling like:", error)
      setLikedPosts(likedPosts)
      fetchPosts(true)
    }
  }

  const toggleComments = (postId: string) => {
    const newExpanded = new Set(expandedComments)
    if (newExpanded.has(postId)) {
      newExpanded.delete(postId)
    } else {
      newExpanded.add(postId)
    }
    setExpandedComments(newExpanded)
  }

  const updateCommentsCount = (postId: string, count: number) => {
    setPosts((prevPosts) => prevPosts.map((post) => (post.id === postId ? { ...post, comments_count: count } : post)))
  }

  const showLikedBy = (postId: string, likesCount: number) => {
    if (likesCount > 0) {
      setLikedByModal({
        isOpen: true,
        postId,
        title: "Liked by",
      })
    }
  }

  const startEdit = (post: Post) => {
    setEditingPost(post.id)
    setEditContent(post.content)
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
  }

  const handleSort = (sort: string) => {
    setSortBy(sort)
  }

  const handleFilter = (newFilters: FilterOptions) => {
    setFilters(newFilters)
  }

  const openReportModal = (contentId: string, contentType: "post" | "comment", reportedUsername: string) => {
    setReportModal({
      isOpen: true,
      contentId,
      contentType,
      reportedUsername,
    })
  }

  const closeReportModal = () => {
    setReportModal({ isOpen: false })
  }

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading posts...</div>
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <SearchAndFilter
        onSearch={handleSearch}
        onSort={handleSort}
        onFilter={handleFilter}
        searchQuery={searchQuery}
        sortBy={sortBy}
        activeFilters={filters}
      />

      {user && (
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-3">
              <Avatar>
                <AvatarImage src={user.profile_picture_url || "/placeholder.svg"} />
                <AvatarFallback>{user.display_name?.[0] || user.username[0]}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{user.display_name || user.username}</p>
                <p className="text-sm text-muted-foreground">Share your thoughts...</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="What's on your mind? (Markdown supported)"
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              className="min-h-[100px] resize-none"
            />
            {moderationWarning && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <Flag className="h-4 w-4 text-red-600" />
                <p className="text-sm text-red-800">{moderationWarning}</p>
              </div>
            )}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Badge variant="outline">Markdown supported</Badge>
                {cooldownRemaining > 0 && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {Math.ceil(cooldownRemaining / 1000)}s
                  </Badge>
                )}
              </div>
              <Button
                onClick={createPost}
                disabled={!newPost.trim() || isPosting || cooldownRemaining > 0}
                className="bg-primary hover:bg-primary/90"
              >
                {isPosting ? "Posting..." : "Post"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {posts.map((post) => (
          <Card key={post.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarImage src={post.app_users?.profile_picture_url || "/placeholder.svg"} />
                    <AvatarFallback>{post.app_users?.display_name?.[0] || post.author_username[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{post.app_users?.display_name || post.author_username}</p>
                    <p className="text-sm text-muted-foreground">
                      @{post.author_username} • {formatDistanceToNow(new Date(post.created_at))} ago
                    </p>
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {user?.username === post.author_username ? (
                      <>
                        <DropdownMenuItem onClick={() => startEdit(post)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => deletePost(post.id)} className="text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </>
                    ) : (
                      <DropdownMenuItem
                        onClick={() => openReportModal(post.id, "post", post.author_username)}
                        className="text-red-600"
                      >
                        <Flag className="h-4 w-4 mr-2" />
                        Report
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {editingPost === post.id ? (
                <div className="space-y-3">
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="min-h-[100px]"
                  />
                  <div className="flex space-x-2">
                    <Button size="sm" onClick={() => updatePost(post.id)}>
                      Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingPost(null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown>{post.content}</ReactMarkdown>
                </div>
              )}

              {post.media_url && (
                <div className="rounded-lg overflow-hidden">
                  {post.media_type?.startsWith("image/") ? (
                    <img
                      src={post.media_url || "/placeholder.svg"}
                      alt="Post media"
                      className="w-full h-auto max-h-96 object-cover"
                    />
                  ) : post.media_type?.startsWith("video/") ? (
                    <video src={post.media_url} controls className="w-full h-auto max-h-96" />
                  ) : null}
                </div>
              )}

              <div className="flex items-center space-x-6 pt-2 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleLike(post.id)}
                  className={`flex items-center space-x-2 transition-colors ${
                    likedPosts.has(post.id)
                      ? "text-red-500 hover:text-red-600"
                      : "text-muted-foreground hover:text-red-500"
                  }`}
                >
                  <Heart className={`h-4 w-4 ${likedPosts.has(post.id) ? "fill-current" : ""}`} />
                  <span
                    className={post.likes_count > 0 ? "cursor-pointer hover:underline" : ""}
                    onClick={(e) => {
                      e.stopPropagation()
                      showLikedBy(post.id, post.likes_count)
                    }}
                  >
                    {post.likes_count}
                  </span>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleComments(post.id)}
                  className="flex items-center space-x-2 text-muted-foreground hover:text-blue-500"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>{post.comments_count}</span>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center space-x-2 text-muted-foreground hover:text-green-500"
                >
                  <Share2 className="h-4 w-4" />
                  <span>{post.shares_count}</span>
                </Button>
              </div>

              <Collapsible open={expandedComments.has(post.id)} onOpenChange={() => toggleComments(post.id)}>
                <CollapsibleContent className="space-y-4 pt-4 border-t">
                  <CommentsSection
                    postId={post.id}
                    commentsCount={post.comments_count}
                    onCommentsCountChange={(count) => updateCommentsCount(post.id, count)}
                  />
                </CollapsibleContent>
              </Collapsible>
            </CardContent>
          </Card>
        ))}
      </div>

      {isLoadingMore && (
        <div className="flex justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      )}

      <div ref={observerRef} className="h-4" />

      {posts.length === 0 && !isLoading && (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">
              {searchQuery || Object.keys(filters).length > 0
                ? "No posts found matching your criteria."
                : "No posts yet. Be the first to share something!"}
            </p>
          </CardContent>
        </Card>
      )}

      <LikedByModal
        isOpen={likedByModal.isOpen}
        onClose={() => setLikedByModal({ isOpen: false, title: "" })}
        postId={likedByModal.postId}
        title={likedByModal.title}
      />
      <ReportModal
        isOpen={reportModal.isOpen}
        onClose={closeReportModal}
        contentId={reportModal.contentId || ""}
        contentType={reportModal.contentType || "post"}
        reportedUsername={reportModal.reportedUsername || ""}
      />
    </div>
  )
}
