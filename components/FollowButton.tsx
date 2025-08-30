"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { UserPlus, UserMinus } from "lucide-react"

interface FollowButtonProps {
  targetUsername: string
  currentUser?: {
    username: string
  }
  onFollowChange?: (isFollowing: boolean, followersCount: number) => void
}

export default function FollowButton({ targetUsername, currentUser, onFollowChange }: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [followersCount, setFollowersCount] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    if (currentUser && currentUser.username !== targetUsername) {
      checkFollowStatus()
      fetchFollowersCount()
    }
  }, [currentUser, targetUsername])

  const checkFollowStatus = async () => {
    if (!currentUser) return

    const { data } = await supabase
      .from("follows")
      .select("id")
      .eq("follower_username", currentUser.username)
      .eq("following_username", targetUsername)
      .single()

    setIsFollowing(!!data)
  }

  const fetchFollowersCount = async () => {
    const { count } = await supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("following_username", targetUsername)

    setFollowersCount(count || 0)
  }

  const toggleFollow = async () => {
    if (!currentUser || isLoading) return

    setIsLoading(true)

    try {
      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from("follows")
          .delete()
          .eq("follower_username", currentUser.username)
          .eq("following_username", targetUsername)

        if (!error) {
          setIsFollowing(false)
          const newCount = Math.max(0, followersCount - 1)
          setFollowersCount(newCount)
          onFollowChange?.(false, newCount)
        }
      } else {
        // Follow
        const { error } = await supabase.from("follows").insert({
          follower_username: currentUser.username,
          following_username: targetUsername,
        })

        if (!error) {
          setIsFollowing(true)
          const newCount = followersCount + 1
          setFollowersCount(newCount)
          onFollowChange?.(true, newCount)
        }
      }
    } catch (error) {
      console.error("Error toggling follow:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Don't show follow button for own profile
  if (!currentUser || currentUser.username === targetUsername) {
    return null
  }

  return (
    <Button
      onClick={toggleFollow}
      disabled={isLoading}
      variant={isFollowing ? "outline" : "default"}
      size="sm"
      className="flex items-center gap-2"
    >
      {isFollowing ? (
        <>
          <UserMinus className="h-4 w-4" />
          {isLoading ? "Unfollowing..." : "Unfollow"}
        </>
      ) : (
        <>
          <UserPlus className="h-4 w-4" />
          {isLoading ? "Following..." : "Follow"}
        </>
      )}
    </Button>
  )
}
