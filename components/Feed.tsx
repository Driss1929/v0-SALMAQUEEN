"use client"
import { useState, useEffect } from "react"
import { useAuth } from "../contexts/AuthContext"
import { useNotifications } from "../contexts/NotificationContext"

interface Post {
  id: number
  type: "post" | "reel"
  content: string
  imageUrl?: string
  videoUrl?: string
  timestamp: string
  likes: number
  author: string
  authorName: string
  likedBy?: string[]
  comments?: Comment[]
  shares?: number
}

interface Comment {
  id: number
  text: string
  author: string
  authorName: string
  timestamp: string
  reactions?: { [emoji: string]: string[] }
  replies?: Reply[]
}

interface Reply {
  id: number
  text: string
  author: string
  authorName: string
  timestamp: string
  reactions?: { [emoji: string]: string[] }
}

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
  viewed: string[]
}

interface JournalEntry {
  id: number
  text: string
  author: string
  authorName: string
  timestamp: string
  day: string
}

interface FeedItem {
  id: string
  type: "post" | "reel" | "story" | "journal"
  content: string
  author: string
  authorName: string
  timestamp: number
  likes?: number
  likedBy?: string[]
  comments?: Comment[]
  shares?: number
  imageUrl?: string
  videoUrl?: string
  mediaUrl?: string
  mediaType?: "image" | "video"
  day?: string
}

function Feed() {
  const [feedItems, setFeedItems] = useState<FeedItem[]>([])
  const [filter, setFilter] = useState<"all" | "posts" | "reels" | "stories" | "journal">("all")
  const [showComments, setShowComments] = useState<string | null>(null)
  const [newComment, setNewComment] = useState("")
  const [showShareModal, setShowShareModal] = useState<FeedItem | null>(null)
  const [shareText, setShareText] = useState("")
  const [replyingTo, setReplyingTo] = useState<number | null>(null)
  const [newReply, setNewReply] = useState("")
  const { currentUser } = useAuth()
  const { addNotification } = useNotifications()

  useEffect(() => {
    if (typeof window !== "undefined") {
      loadFeedItems()
    }
  }, [])

  const loadFeedItems = () => {
    const allItems: FeedItem[] = []

    const idrissPosts = localStorage.getItem("userPosts_idriss")
    const salmaPosts = localStorage.getItem("userPosts_salma")

    if (idrissPosts) {
      const posts: Post[] = JSON.parse(idrissPosts)
      posts.forEach((post) => {
        allItems.push({
          id: `post_${post.id}`,
          type: post.type,
          content: post.content,
          author: post.author,
          authorName: post.authorName,
          timestamp: new Date(post.timestamp).getTime() || Date.now(),
          likes: post.likes || 0,
          likedBy: post.likedBy || [],
          comments: post.comments || [],
          shares: post.shares || 0,
          imageUrl: post.imageUrl,
          videoUrl: post.videoUrl,
        })
      })
    }

    if (salmaPosts) {
      const posts: Post[] = JSON.parse(salmaPosts)
      posts.forEach((post) => {
        allItems.push({
          id: `post_${post.id}`,
          type: post.type,
          content: post.content,
          author: post.author,
          authorName: post.authorName,
          timestamp: new Date(post.timestamp).getTime() || Date.now(),
          likes: post.likes || 0,
          likedBy: post.likedBy || [],
          comments: post.comments || [],
          shares: post.shares || 0,
          imageUrl: post.imageUrl,
          videoUrl: post.videoUrl,
        })
      })
    }

    const stories = localStorage.getItem("idrissSalmaStories")
    if (stories) {
      const storyData: Story[] = JSON.parse(stories)
      storyData.forEach((story) => {
        if (story.expiresAt > Date.now()) {
          allItems.push({
            id: `story_${story.id}`,
            type: "story",
            content: story.text || "Shared a story",
            author: story.userId,
            authorName: story.userName,
            timestamp: story.timestamp,
            mediaUrl: story.mediaUrl,
            mediaType: story.mediaType,
          })
        }
      })
    }

    const journal = localStorage.getItem("idrissSalmaJournal")
    if (journal) {
      const journalData = JSON.parse(journal)
      Object.keys(journalData).forEach((day) => {
        Object.keys(journalData[day]).forEach((username) => {
          const entry: JournalEntry = journalData[day][username]
          allItems.push({
            id: `journal_${entry.id}`,
            type: "journal",
            content: entry.text,
            author: entry.author,
            authorName: entry.authorName,
            timestamp: new Date(entry.timestamp).getTime() || Date.now(),
            day: entry.day,
          })
        })
      })
    }

    allItems.sort((a, b) => b.timestamp - a.timestamp)
    setFeedItems(allItems)
    console.log("[v0] Loaded feed items:", allItems.length)
  }

  const handleLike = (itemId: string) => {
    if (!currentUser) return

    const [itemType, originalId] = itemId.split("_")
    if (itemType !== "post") return

    setFeedItems((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          const likedBy = item.likedBy || []
          const hasLiked = likedBy.includes(currentUser.username)

          const updatedItem = {
            ...item,
            likes: hasLiked ? (item.likes || 0) - 1 : (item.likes || 0) + 1,
            likedBy: hasLiked
              ? likedBy.filter((user) => user !== currentUser.username)
              : [...likedBy, currentUser.username],
          }

          if (!hasLiked && item.author !== currentUser.username) {
            addNotification({
              type: "like",
              title: "New Like",
              message: `${currentUser.name} liked your ${item.type}`,
              fromUser: currentUser.username,
              fromUserName: currentUser.name,
              targetId: itemId,
              targetType: item.type as "post" | "reel",
              icon: "❤️",
            })
          }

          const storageKey = `userPosts_${item.author}`
          const savedPosts = localStorage.getItem(storageKey)
          if (savedPosts) {
            const posts: Post[] = JSON.parse(savedPosts)
            const updatedPosts = posts.map((post) =>
              post.id.toString() === originalId
                ? {
                    ...post,
                    likes: updatedItem.likes,
                    likedBy: updatedItem.likedBy,
                  }
                : post,
            )
            localStorage.setItem(storageKey, JSON.stringify(updatedPosts))
          }

          return updatedItem
        }
        return item
      }),
    )

    console.log("[v0] Liked/unliked post:", itemId)
  }

  const handleComment = (itemId: string) => {
    if (!currentUser || !newComment.trim()) return

    const [itemType, originalId] = itemId.split("_")
    if (itemType !== "post") return

    const comment: Comment = {
      id: Date.now(),
      text: newComment.trim(),
      author: currentUser.username,
      authorName: currentUser.name,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      reactions: {},
      replies: [],
    }

    setFeedItems((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          const updatedComments = [...(item.comments || []), comment]
          const updatedItem = { ...item, comments: updatedComments }

          const storageKey = `userPosts_${item.author}`
          const savedPosts = localStorage.getItem(storageKey)
          if (savedPosts) {
            const posts: Post[] = JSON.parse(savedPosts)
            const updatedPosts = posts.map((post) =>
              post.id.toString() === originalId ? { ...post, comments: updatedComments } : post,
            )
            localStorage.setItem(storageKey, JSON.stringify(updatedPosts))
            console.log("[v0] Saved comment to localStorage for:", storageKey)
          }

          if (item.author !== currentUser.username) {
            addNotification({
              type: "comment",
              title: "New Comment",
              message: `${currentUser.name} commented on your ${item.type}: "${newComment.trim()}"`,
              fromUser: currentUser.username,
              fromUserName: currentUser.name,
              targetId: itemId,
              targetType: item.type as "post" | "reel",
              icon: "💬",
            })
          }

          return updatedItem
        }
        return item
      }),
    )

    setNewComment("")
    console.log("[v0] Added comment to post:", itemId)
  }

  const handleShare = (item: FeedItem) => {
    if (!currentUser) return
    setShowShareModal(item)
    setShareText(`Check out this ${item.type} from ${item.authorName}: "${item.content}"`)
  }

  const confirmShare = () => {
    if (!currentUser || !showShareModal || !shareText.trim()) return

    const sharedPost: Post = {
      id: Date.now(),
      type: "post",
      content: shareText.trim(),
      timestamp: new Date().toLocaleDateString(),
      likes: 0,
      likedBy: [],
      comments: [],
      shares: 0,
      author: currentUser.username,
      authorName: currentUser.name,
      ...(showShareModal.imageUrl && { imageUrl: showShareModal.imageUrl }),
      ...(showShareModal.videoUrl && { videoUrl: showShareModal.videoUrl }),
    }

    const storageKey = `userPosts_${currentUser.username}`
    const savedPosts = localStorage.getItem(storageKey)
    const posts: Post[] = savedPosts ? JSON.parse(savedPosts) : []
    const updatedPosts = [sharedPost, ...posts]
    localStorage.setItem(storageKey, JSON.stringify(updatedPosts))

    if (showShareModal.author !== currentUser.username) {
      addNotification({
        type: "share",
        title: "Content Shared",
        message: `${currentUser.name} shared your ${showShareModal.type}`,
        fromUser: currentUser.username,
        fromUserName: currentUser.name,
        targetId: showShareModal.id,
        targetType: showShareModal.type as "post" | "reel",
        icon: "🔄",
      })
    }

    const [itemType, originalId] = showShareModal.id.split("_")
    if (itemType === "post") {
      setFeedItems((prev) =>
        prev.map((item) => {
          if (item.id === showShareModal.id) {
            const updatedItem = { ...item, shares: (item.shares || 0) + 1 }

            const originalStorageKey = `userPosts_${item.author}`
            const originalSavedPosts = localStorage.getItem(originalStorageKey)
            if (originalSavedPosts) {
              const originalPosts: Post[] = JSON.parse(originalSavedPosts)
              const updatedOriginalPosts = originalPosts.map((post) =>
                post.id.toString() === originalId ? { ...post, shares: updatedItem.shares } : post,
              )
              localStorage.setItem(originalStorageKey, JSON.stringify(updatedOriginalPosts))
            }

            return updatedItem
          }
          return item
        }),
      )
    }

    loadFeedItems()
    setShowShareModal(null)
    setShareText("")
    console.log("[v0] Shared post successfully")
  }

  const handleCommentReaction = (itemId: string, commentId: number, emoji: string) => {
    if (!currentUser) return

    const [itemType, originalId] = itemId.split("_")
    if (itemType !== "post") return

    setFeedItems((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          const updatedComments = (item.comments || []).map((comment) => {
            if (comment.id === commentId) {
              const reactions = { ...comment.reactions }
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

              return { ...comment, reactions }
            }
            return comment
          })

          const updatedItem = { ...item, comments: updatedComments }

          // Save to localStorage
          const storageKey = `userPosts_${item.author}`
          const savedPosts = localStorage.getItem(storageKey)
          if (savedPosts) {
            const posts: Post[] = JSON.parse(savedPosts)
            const updatedPosts = posts.map((post) =>
              post.id.toString() === originalId ? { ...post, comments: updatedComments } : post,
            )
            localStorage.setItem(storageKey, JSON.stringify(updatedPosts))
          }

          return updatedItem
        }
        return item
      }),
    )
  }

  const handleReply = (itemId: string, commentId: number) => {
    if (!currentUser || !newReply.trim()) return

    const [itemType, originalId] = itemId.split("_")
    if (itemType !== "post") return

    const reply: Reply = {
      id: Date.now(),
      text: newReply.trim(),
      author: currentUser.username,
      authorName: currentUser.name,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      reactions: {},
    }

    setFeedItems((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          const updatedComments = (item.comments || []).map((comment) => {
            if (comment.id === commentId) {
              return { ...comment, replies: [...(comment.replies || []), reply] }
            }
            return comment
          })

          const updatedItem = { ...item, comments: updatedComments }

          // Save to localStorage
          const storageKey = `userPosts_${item.author}`
          const savedPosts = localStorage.getItem(storageKey)
          if (savedPosts) {
            const posts: Post[] = JSON.parse(savedPosts)
            const updatedPosts = posts.map((post) =>
              post.id.toString() === originalId ? { ...post, comments: updatedComments } : post,
            )
            localStorage.setItem(storageKey, JSON.stringify(updatedPosts))
          }

          return updatedItem
        }
        return item
      }),
    )

    setNewReply("")
    setReplyingTo(null)
    console.log("[v0] Added reply to comment:", commentId)
  }

  const filteredItems =
    filter === "all"
      ? feedItems
      : feedItems.filter((item) => {
          if (filter === "posts") return item.type === "post"
          if (filter === "reels") return item.type === "reel"
          if (filter === "stories") return item.type === "story"
          if (filter === "journal") return item.type === "journal"
          return true
        })

  const getItemIcon = (type: string) => {
    switch (type) {
      case "post":
        return "📝"
      case "reel":
        return "🎬"
      case "story":
        return "📚"
      case "journal":
        return "📖"
      default:
        return "📄"
    }
  }

  const getAuthorColor = (author: string) => {
    return author === "idriss" ? "text-blue-600" : "text-pink-600"
  }

  const getAuthorBg = (author: string) => {
    return author === "idriss" ? "bg-blue-100" : "bg-pink-100"
  }

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - timestamp
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  if (!currentUser) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-2">🏠 Social Feed</h1>
          <p className="text-lg text-gray-600">See what you and your partner have been up to</p>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-2xl shadow-lg mb-6 p-2">
          <div className="flex flex-wrap gap-2">
            {[
              { key: "all", label: "All", icon: "🌟" },
              { key: "posts", label: "Posts", icon: "📝" },
              { key: "reels", label: "Reels", icon: "🎬" },
              { key: "stories", label: "Stories", icon: "📚" },
              { key: "journal", label: "Journal", icon: "📖" },
            ].map(({ key, label, icon }) => (
              <button
                key={key}
                onClick={() => setFilter(key as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors ${
                  filter === key ? "bg-blue-500 text-white" : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <span>{icon}</span>
                <span>{label}</span>
                <span className="text-xs opacity-75">
                  (
                  {key === "all"
                    ? feedItems.length
                    : feedItems.filter((item) => {
                        if (key === "posts") return item.type === "post"
                        if (key === "reels") return item.type === "reel"
                        if (key === "stories") return item.type === "story"
                        if (key === "journal") return item.type === "journal"
                        return true
                      }).length}
                  )
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Feed Items */}
        <div className="space-y-6">
          {filteredItems.length === 0 ? (
            <div className="bg-white rounded-3xl shadow-xl p-12 text-center">
              <div className="text-6xl mb-4">📭</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">No content yet</h3>
              <p className="text-gray-600 mb-6">
                Start sharing posts, reels, stories, or journal entries to see them here!
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                <button
                  onClick={() => (window.location.href = "/profile")}
                  className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
                >
                  Create Post
                </button>
                <button
                  onClick={() => (window.location.href = "/stories")}
                  className="px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium transition-colors"
                >
                  Add Story
                </button>
                <button
                  onClick={() => (window.location.href = "/journal")}
                  className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
                >
                  Write Journal
                </button>
              </div>
            </div>
          ) : (
            filteredItems.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-3xl shadow-xl overflow-hidden hover:shadow-2xl transition-shadow"
              >
                {/* Post Header */}
                <div className="p-6 pb-4">
                  <div className="flex items-center gap-4 mb-4">
                    <div
                      className={`w-12 h-12 rounded-full ${getAuthorBg(item.author)} flex items-center justify-center`}
                    >
                      <span className={`text-xl font-bold ${getAuthorColor(item.author)}`}>
                        {item.authorName.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className={`font-bold ${getAuthorColor(item.author)}`}>{item.authorName}</h3>
                        <span className="text-2xl">{getItemIcon(item.type)}</span>
                        <span className="text-sm text-gray-500 capitalize">{item.type}</span>
                      </div>
                      <p className="text-sm text-gray-500">{formatTimestamp(item.timestamp)}</p>
                      {item.day && <p className="text-xs text-gray-400">Day {item.day}</p>}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="mb-4">
                    <p className="text-gray-800 text-lg leading-relaxed">{item.content}</p>
                  </div>

                  {/* Media */}
                  {item.imageUrl && (
                    <div className="mb-4">
                      <img
                        src={item.imageUrl || "/placeholder.svg"}
                        alt="Post content"
                        className="w-full max-h-96 object-cover rounded-2xl"
                      />
                    </div>
                  )}

                  {item.videoUrl && (
                    <div className="mb-4">
                      <video src={item.videoUrl} controls className="w-full max-h-96 object-cover rounded-2xl" />
                    </div>
                  )}

                  {item.mediaUrl && (
                    <div className="mb-4">
                      {item.mediaType === "image" ? (
                        <img
                          src={item.mediaUrl || "/placeholder.svg"}
                          alt="Story content"
                          className="w-full max-h-96 object-cover rounded-2xl"
                        />
                      ) : (
                        <video src={item.mediaUrl} controls className="w-full max-h-96 object-cover rounded-2xl" />
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-6">
                      {item.likes !== undefined && (
                        <button
                          onClick={() => handleLike(item.id)}
                          className={`flex items-center gap-2 transition-colors ${
                            item.likedBy?.includes(currentUser.username)
                              ? "text-red-500"
                              : "text-gray-600 hover:text-red-500"
                          }`}
                        >
                          <span className="text-xl">❤️</span>
                          <span className="font-medium">{item.likes}</span>
                        </button>
                      )}
                      <button
                        onClick={() => setShowComments(showComments === item.id ? null : item.id)}
                        className="flex items-center gap-2 text-gray-600 hover:text-blue-500 transition-colors"
                      >
                        <span className="text-xl">💬</span>
                        <span className="font-medium">{item.comments?.length || 0}</span>
                      </button>
                      <button
                        onClick={() => handleShare(item)}
                        className="flex items-center gap-2 text-gray-600 hover:text-green-500 transition-colors"
                      >
                        <span className="text-xl">🔄</span>
                        <span className="font-medium">{item.shares || 0}</span>
                      </button>
                    </div>
                    <div className="text-sm text-gray-500">
                      {item.type === "story"
                        ? "Story"
                        : item.type === "journal"
                          ? "Journal Entry"
                          : item.type === "reel"
                            ? "Reel"
                            : "Post"}
                    </div>
                  </div>

                  {showComments === item.id && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                        {item.comments?.map((comment) => (
                          <div key={comment.id} className="space-y-2">
                            <div className="flex gap-3">
                              <div
                                className={`w-8 h-8 rounded-full ${getAuthorBg(comment.author)} flex items-center justify-center flex-shrink-0`}
                              >
                                <span className={`text-sm font-bold ${getAuthorColor(comment.author)}`}>
                                  {comment.authorName.charAt(0)}
                                </span>
                              </div>
                              <div className="flex-1">
                                <div className="bg-gray-100 rounded-2xl px-3 py-2 relative group">
                                  <p className={`font-medium text-sm ${getAuthorColor(comment.author)}`}>
                                    {comment.authorName}
                                  </p>
                                  <p className="text-gray-800">{comment.text}</p>

                                  <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 left-0 flex gap-1 bg-white rounded-full shadow-lg p-1 z-10">
                                    {["❤️", "😂", "👍", "😮", "😢", "😡"].map((emoji) => (
                                      <button
                                        key={emoji}
                                        onClick={() => handleCommentReaction(item.id, comment.id, emoji)}
                                        className="hover:bg-gray-100 rounded-full p-1 text-sm transition-colors"
                                      >
                                        {emoji}
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                {comment.reactions && Object.keys(comment.reactions).length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1 ml-3">
                                    {Object.entries(comment.reactions).map(([emoji, users]) => (
                                      <button
                                        key={emoji}
                                        onClick={() => handleCommentReaction(item.id, comment.id, emoji)}
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

                                <div className="flex items-center gap-4 mt-1">
                                  <p className="text-xs text-gray-500">{comment.timestamp}</p>
                                  <button
                                    onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                                    className="text-xs text-blue-500 hover:text-blue-700 transition-colors"
                                  >
                                    Reply
                                  </button>
                                </div>

                                {comment.replies && comment.replies.length > 0 && (
                                  <div className="ml-4 mt-2 space-y-2">
                                    {comment.replies.map((reply) => (
                                      <div key={reply.id} className="flex gap-2">
                                        <div
                                          className={`w-6 h-6 rounded-full ${getAuthorBg(reply.author)} flex items-center justify-center flex-shrink-0`}
                                        >
                                          <span className={`text-xs font-bold ${getAuthorColor(reply.author)}`}>
                                            {reply.authorName.charAt(0)}
                                          </span>
                                        </div>
                                        <div className="flex-1">
                                          <div className="bg-gray-50 rounded-xl px-2 py-1">
                                            <p className={`font-medium text-xs ${getAuthorColor(reply.author)}`}>
                                              {reply.authorName}
                                            </p>
                                            <p className="text-gray-800 text-sm">{reply.text}</p>
                                          </div>
                                          <p className="text-xs text-gray-500 mt-1">{reply.timestamp}</p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {replyingTo === comment.id && (
                                  <div className="flex gap-2 mt-2 ml-4">
                                    <input
                                      type="text"
                                      value={newReply}
                                      onChange={(e) => setNewReply(e.target.value)}
                                      placeholder="Write a reply..."
                                      className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded-full focus:outline-none focus:border-blue-500"
                                      onKeyPress={(e) => e.key === "Enter" && handleReply(item.id, comment.id)}
                                    />
                                    <button
                                      onClick={() => handleReply(item.id, comment.id)}
                                      disabled={!newReply.trim()}
                                      className={`px-3 py-1 text-sm rounded-full font-medium transition-colors ${
                                        newReply.trim()
                                          ? "bg-blue-500 hover:bg-blue-600 text-white"
                                          : "bg-gray-300 text-gray-500 cursor-not-allowed"
                                      }`}
                                    >
                                      Reply
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder="Write a comment..."
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-full focus:outline-none focus:border-blue-500"
                          onKeyPress={(e) => e.key === "Enter" && handleComment(item.id)}
                        />
                        <button
                          onClick={() => handleComment(item.id)}
                          disabled={!newComment.trim()}
                          className={`px-4 py-2 rounded-full font-medium transition-colors ${
                            newComment.trim()
                              ? "bg-blue-500 hover:bg-blue-600 text-white"
                              : "bg-gray-300 text-gray-500 cursor-not-allowed"
                          }`}
                        >
                          Post
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Refresh Button */}
        <div className="text-center mt-8">
          <button
            onClick={loadFeedItems}
            className="px-6 py-3 bg-white hover:bg-gray-50 text-gray-700 rounded-full shadow-lg hover:shadow-xl transition-all font-medium"
          >
            🔄 Refresh Feed
          </button>
        </div>
      </div>

      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Share {showShareModal.type}</h2>
              <button onClick={() => setShowShareModal(null)} className="text-gray-500 hover:text-gray-700 text-2xl">
                ×
              </button>
            </div>

            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className={`font-bold ${getAuthorColor(showShareModal.author)}`}>
                  {showShareModal.authorName}
                </span>
                <span className="text-sm text-gray-500">• {showShareModal.type}</span>
              </div>
              <p className="text-gray-700 text-sm">{showShareModal.content}</p>
            </div>

            <textarea
              value={shareText}
              onChange={(e) => setShareText(e.target.value)}
              placeholder="Add your thoughts..."
              className="w-full p-3 border border-gray-300 rounded-lg resize-none mb-4"
              rows={3}
              maxLength={500}
            />

            <div className="flex gap-3">
              <button
                onClick={() => setShowShareModal(null)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmShare}
                disabled={!shareText.trim()}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                  shareText.trim()
                    ? "bg-green-500 hover:bg-green-600 text-white"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                Share
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Feed
