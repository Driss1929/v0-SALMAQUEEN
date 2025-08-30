"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useAuth } from "../contexts/AuthContext"
import { useNotifications } from "../contexts/NotificationContext"
import ProfilePictureUpload from "./ProfilePictureUpload"

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
}

function Profile() {
  const { currentUser, updateBio, incrementPostsCount, incrementReelsCount } = useAuth()
  const { addNotification } = useNotifications()
  const [posts, setPosts] = useState<Post[]>([])
  const [showProfileUpload, setShowProfileUpload] = useState(false)
  const [isEditingBio, setIsEditingBio] = useState(false)
  const [bioText, setBioText] = useState("")
  const [showCreatePost, setShowCreatePost] = useState(false)
  const [newPostContent, setNewPostContent] = useState("")
  const [newPostType, setNewPostType] = useState<"post" | "reel">("post")
  const [activeTab, setActiveTab] = useState<"posts" | "reels">("posts")
  const [showFollowersModal, setShowFollowersModal] = useState<"followers" | "following" | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (currentUser) {
      setBioText(currentUser.bio || "")

      // Load posts from localStorage
      if (typeof window !== "undefined") {
        const savedPosts = localStorage.getItem(`userPosts_${currentUser.username}`)
        if (savedPosts) {
          setPosts(JSON.parse(savedPosts))
        }
      }
    }
  }, [currentUser])

  useEffect(() => {
    if (typeof window !== "undefined" && currentUser) {
      localStorage.setItem(`userPosts_${currentUser.username}`, JSON.stringify(posts))
    }
  }, [posts, currentUser])

  const handleBioSave = () => {
    if (bioText.trim()) {
      updateBio(bioText.trim())
      setIsEditingBio(false)
      console.log("[v0] Bio updated successfully")
    }
  }

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault()
    if (newPostContent.trim() && currentUser) {
      const post: Post = {
        id: Date.now(),
        type: newPostType,
        content: newPostContent.trim(),
        timestamp: new Date().toLocaleDateString(),
        likes: 0,
        author: currentUser.username,
        authorName: currentUser.name,
      }

      setPosts((prevPosts) => {
        const updatedPosts = [post, ...prevPosts]
        if (typeof window !== "undefined") {
          localStorage.setItem(`userPosts_${currentUser.username}`, JSON.stringify(updatedPosts))
        }
        return updatedPosts
      })

      if (newPostType === "post") {
        incrementPostsCount()
      } else {
        incrementReelsCount()
      }

      addNotification({
        type: newPostType,
        title: `New ${newPostType.charAt(0).toUpperCase() + newPostType.slice(1)}`,
        message: `${currentUser.name} shared a new ${newPostType}: "${newPostContent.trim()}"`,
        fromUser: currentUser.username,
        fromUserName: currentUser.name,
        targetId: `post_${post.id}`,
        targetType: newPostType,
        icon: newPostType === "post" ? "📝" : "🎬",
      })

      setNewPostContent("")
      setShowCreatePost(false)
      console.log("[v0] Post created successfully")
    }
  }

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && currentUser) {
      if (file.size > 10 * 1024 * 1024) {
        alert("File size must be less than 10MB")
        return
      }

      const reader = new FileReader()
      reader.onload = (event) => {
        const mediaUrl = event.target?.result as string
        const post: Post = {
          id: Date.now(),
          type: newPostType,
          content: newPostContent.trim() || `New ${newPostType} from ${currentUser.name}`,
          timestamp: new Date().toLocaleDateString(),
          likes: 0,
          author: currentUser.username,
          authorName: currentUser.name,
          ...(file.type.startsWith("image/") ? { imageUrl: mediaUrl } : { videoUrl: mediaUrl }),
        }

        setPosts((prevPosts) => {
          const updatedPosts = [post, ...prevPosts]
          if (typeof window !== "undefined") {
            localStorage.setItem(`userPosts_${currentUser.username}`, JSON.stringify(updatedPosts))
          }
          return updatedPosts
        })

        if (newPostType === "post") {
          incrementPostsCount()
        } else {
          incrementReelsCount()
        }

        addNotification({
          type: newPostType,
          title: `New ${newPostType.charAt(0).toUpperCase() + newPostType.slice(1)}`,
          message: `${currentUser.name} shared a new ${newPostType} with media`,
          fromUser: currentUser.username,
          fromUserName: currentUser.name,
          targetId: `post_${post.id}`,
          targetType: newPostType,
          icon: newPostType === "post" ? "📝" : "🎬",
        })

        setNewPostContent("")
        setShowCreatePost(false)
        console.log("[v0] Media post created successfully")
      }
      reader.readAsDataURL(file)
    }
  }

  const likePost = (postId: number) => {
    setPosts((prev) => {
      const updatedPosts = prev.map((post) => (post.id === postId ? { ...post, likes: post.likes + 1 } : post))
      if (typeof window !== "undefined" && currentUser) {
        localStorage.setItem(`userPosts_${currentUser.username}`, JSON.stringify(updatedPosts))
      }
      return updatedPosts
    })
  }

  const getFollowersList = (type: "followers" | "following") => {
    // For demo purposes, return the other user as follower/following
    const otherUser = currentUser?.username === "idriss" ? "salma" : "idriss"
    const otherUserName = currentUser?.username === "idriss" ? "Salma" : "Idriss"

    return [
      {
        username: otherUser,
        name: otherUserName,
        profilePicture: otherUser === "idriss" ? "/idriss-profile.jpg.jpg" : "/salma-profile.jpg.jpg",
      },
    ]
  }

  const filteredPosts = posts.filter((post) => post.type === (activeTab.slice(0, -1) as "post" | "reel"))

  if (!currentUser) return null

  return (
    <>
      <div className="max-w-4xl mx-auto">
        {/* Profile Header */}
        <div className="bg-white rounded-3xl shadow-xl p-8 mb-6">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Profile Picture */}
            <div
              className="w-32 h-32 rounded-full overflow-hidden border-4 border-gray-200 cursor-pointer hover:border-gray-400 transition-colors relative group flex-shrink-0"
              onClick={() => setShowProfileUpload(true)}
            >
              <img
                src={
                  currentUser.profilePicture ||
                  (currentUser.username === "idriss" ? "/idriss-profile.jpg.jpg" : "/salma-profile.jpg.jpg")
                }
                alt={`${currentUser.name}'s profile`}
                className="w-full h-full object-cover group-hover:opacity-80 transition-opacity"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.style.display = "none"
                  const fallback = target.nextSibling as HTMLElement
                  if (fallback) {
                    fallback.style.display = "flex"
                  }
                }}
              />
              <div
                className={`w-full h-full flex items-center justify-center text-4xl ${
                  currentUser.color === "pink" ? "bg-pink-100 text-pink-600" : "bg-blue-100 text-blue-600"
                } group-hover:opacity-80 transition-opacity`}
                style={{ display: "none" }}
              >
                {currentUser.name.charAt(0)}
              </div>
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-white text-2xl">📷</span>
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">{currentUser.name}</h1>
              <p className="text-gray-600 mb-4">@{currentUser.username}</p>

              {/* Stats */}
              <div className="flex justify-center md:justify-start gap-6 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-800">{currentUser.postsCount}</div>
                  <div className="text-sm text-gray-600">Posts</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-800">{currentUser.reelsCount}</div>
                  <div className="text-sm text-gray-600">Reels</div>
                </div>
                <div
                  className="text-center cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
                  onClick={() => setShowFollowersModal("followers")}
                >
                  <div className="text-2xl font-bold text-gray-800">{currentUser.followersCount}</div>
                  <div className="text-sm text-gray-600">Followers</div>
                </div>
                <div
                  className="text-center cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
                  onClick={() => setShowFollowersModal("following")}
                >
                  <div className="text-2xl font-bold text-gray-800">{currentUser.followingCount}</div>
                  <div className="text-sm text-gray-600">Following</div>
                </div>
              </div>

              {/* Bio */}
              <div className="mb-4">
                {isEditingBio ? (
                  <div className="space-y-2">
                    <textarea
                      value={bioText}
                      onChange={(e) => setBioText(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg resize-none"
                      rows={3}
                      maxLength={150}
                      placeholder="Tell us about yourself..."
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleBioSave}
                        className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                      >
                        Save Bio
                      </button>
                      <button
                        onClick={() => {
                          setBioText(currentUser.bio || "")
                          setIsEditingBio(false)
                        }}
                        className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <p className="text-gray-700">{currentUser.bio || "No bio yet. Click to add one!"}</p>
                    <button
                      onClick={() => setIsEditingBio(true)}
                      className="text-blue-500 hover:text-blue-700 text-sm p-1 hover:bg-blue-50 rounded transition-colors"
                      title="Edit Bio"
                    >
                      ✏️ Edit
                    </button>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-center md:justify-start">
                <button
                  onClick={() => setShowCreatePost(true)}
                  className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                    currentUser.color === "pink"
                      ? "bg-pink-500 hover:bg-pink-600 text-white"
                      : "bg-blue-500 hover:bg-blue-600 text-white"
                  }`}
                >
                  Create Post
                </button>
                <button
                  onClick={() => setShowProfileUpload(true)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Edit Profile
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content Tabs */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab("posts")}
              className={`flex-1 py-4 px-6 font-medium transition-colors ${
                activeTab === "posts" ? "border-b-2 border-blue-500 text-blue-600" : "text-gray-600 hover:text-gray-800"
              }`}
            >
              📝 Posts ({posts.filter((p) => p.type === "post").length})
            </button>
            <button
              onClick={() => setActiveTab("reels")}
              className={`flex-1 py-4 px-6 font-medium transition-colors ${
                activeTab === "reels" ? "border-b-2 border-blue-500 text-blue-600" : "text-gray-600 hover:text-gray-800"
              }`}
            >
              🎬 Reels ({posts.filter((p) => p.type === "reel").length})
            </button>
          </div>

          {/* Posts/Reels Grid */}
          <div className="p-6">
            {filteredPosts.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">{activeTab === "posts" ? "📝" : "🎬"}</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No {activeTab} yet</h3>
                <p className="text-gray-600 mb-4">Share your first {activeTab.slice(0, -1)} with your partner!</p>
                <button
                  onClick={() => setShowCreatePost(true)}
                  className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                    currentUser.color === "pink"
                      ? "bg-pink-500 hover:bg-pink-600 text-white"
                      : "bg-blue-500 hover:bg-blue-600 text-white"
                  }`}
                >
                  Create {activeTab.slice(0, -1)}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPosts.map((post) => (
                  <div key={post.id} className="bg-gray-50 rounded-2xl p-4 hover:shadow-lg transition-shadow">
                    {post.imageUrl && (
                      <img
                        src={post.imageUrl || "/placeholder.svg"}
                        alt="Post content"
                        className="w-full h-48 object-cover rounded-lg mb-3"
                      />
                    )}
                    {post.videoUrl && (
                      <video src={post.videoUrl} controls className="w-full h-48 object-cover rounded-lg mb-3" />
                    )}
                    <p className="text-gray-800 mb-2">{post.content}</p>
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>{post.timestamp}</span>
                      <button
                        onClick={() => likePost(post.id)}
                        className="flex items-center gap-1 hover:text-red-500 transition-colors"
                      >
                        ❤️ {post.likes}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Post Modal */}
      {showCreatePost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Create New {newPostType}</h2>
              <button onClick={() => setShowCreatePost(false)} className="text-gray-500 hover:text-gray-700 text-2xl">
                ×
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-4">
              {/* Post Type Toggle */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setNewPostType("post")}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                    newPostType === "post" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  📝 Post
                </button>
                <button
                  type="button"
                  onClick={() => setNewPostType("reel")}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                    newPostType === "reel" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  🎬 Reel
                </button>
              </div>

              {/* Content Input */}
              <textarea
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                placeholder={`What's on your mind for this ${newPostType}?`}
                className="w-full p-3 border border-gray-300 rounded-lg resize-none"
                rows={4}
                maxLength={500}
              />

              {/* Media Upload */}
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={newPostType === "reel" ? "video/*" : "image/*"}
                  onChange={handleMediaUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors"
                >
                  <div className="text-2xl mb-2">{newPostType === "reel" ? "🎥" : "📷"}</div>
                  <p className="text-gray-600">Add {newPostType === "reel" ? "video" : "photo"} (optional)</p>
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreatePost(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newPostContent.trim()}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                    newPostContent.trim()
                      ? `${
                          currentUser.color === "pink"
                            ? "bg-pink-500 hover:bg-pink-600"
                            : "bg-blue-500 hover:bg-blue-600"
                        } text-white`
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  Share {newPostType}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Followers/Following Modal */}
      {showFollowersModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                {showFollowersModal === "followers" ? "Followers" : "Following"}
              </h2>
              <button
                onClick={() => setShowFollowersModal(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-3">
              {getFollowersList(showFollowersModal).map((user) => (
                <div key={user.username} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg">
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-gray-200">
                    <img
                      src={user.profilePicture || "/placeholder.svg"}
                      alt={`${user.name}'s profile`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = "none"
                        const fallback = target.nextSibling as HTMLElement
                        if (fallback) {
                          fallback.style.display = "flex"
                        }
                      }}
                    />
                    <div
                      className="w-full h-full flex items-center justify-center text-lg bg-blue-100 text-blue-600"
                      style={{ display: "none" }}
                    >
                      {user.name.charAt(0)}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-800">{user.name}</div>
                    <div className="text-sm text-gray-600">@{user.username}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showProfileUpload && <ProfilePictureUpload onClose={() => setShowProfileUpload(false)} />}
    </>
  )
}

export default Profile
