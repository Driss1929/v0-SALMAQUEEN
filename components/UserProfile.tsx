"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Edit, Save, X, Calendar } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import FollowButton from "./FollowButton"

interface UserProfile {
  id: string
  username: string
  display_name: string
  bio?: string
  profile_picture_url?: string
  created_at: string
  is_online: boolean
  last_seen: string
  following_count: number
  followers_count: number
  posts_count: number
}

interface UserProfileProps {
  username?: string
}

export default function UserProfile({ username }: UserProfileProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    display_name: "",
    bio: "",
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchCurrentUser()
  }, [])

  useEffect(() => {
    if (currentUser) {
      fetchProfile()
    }
  }, [username, currentUser])

  const fetchCurrentUser = async () => {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()
    if (authUser) {
      const { data: userData } = await supabase.from("app_users").select("*").eq("id", authUser.id).single()
      if (userData) {
        setCurrentUser(userData)
      }
    }
  }

  const fetchProfile = async () => {
    setIsLoading(true)
    const targetUsername = username || currentUser?.username

    if (!targetUsername) {
      setIsLoading(false)
      return
    }

    const { data, error } = await supabase.from("app_users").select("*").eq("username", targetUsername).single()

    if (error) {
      console.error("Error fetching profile:", error)
    } else {
      setProfile(data)
      setEditForm({
        display_name: data.display_name || "",
        bio: data.bio || "",
      })
    }
    setIsLoading(false)
  }

  const handleSave = async () => {
    if (!profile || !currentUser) return

    setIsSaving(true)
    const { error } = await supabase
      .from("app_users")
      .update({
        display_name: editForm.display_name,
        bio: editForm.bio,
      })
      .eq("id", profile.id)

    if (error) {
      console.error("Error updating profile:", error)
    } else {
      setProfile({
        ...profile,
        display_name: editForm.display_name,
        bio: editForm.bio,
      })
      setIsEditing(false)
    }
    setIsSaving(false)
  }

  const handleFollowChange = (isFollowing: boolean, followersCount: number) => {
    if (profile) {
      setProfile({
        ...profile,
        followers_count: followersCount,
      })
    }
  }

  const isOwnProfile = currentUser?.username === profile?.username

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading profile...</div>
  }

  if (!profile) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <p className="text-muted-foreground">Profile not found</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Profile Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex flex-col items-center md:items-start">
              <Avatar className="h-24 w-24 mb-4">
                <AvatarImage src={profile.profile_picture_url || "/placeholder.svg"} />
                <AvatarFallback className="text-2xl">{profile.display_name?.[0] || profile.username[0]}</AvatarFallback>
              </Avatar>
              <div className="flex items-center gap-2">
                <div className={`h-3 w-3 rounded-full ${profile.is_online ? "bg-green-500" : "bg-gray-400"}`} />
                <span className="text-sm text-muted-foreground">
                  {profile.is_online ? "Online" : `Last seen ${formatDistanceToNow(new Date(profile.last_seen))} ago`}
                </span>
              </div>
            </div>

            <div className="flex-1 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  {isEditing ? (
                    <Input
                      value={editForm.display_name}
                      onChange={(e) => setEditForm({ ...editForm, display_name: e.target.value })}
                      className="text-2xl font-bold mb-2"
                    />
                  ) : (
                    <h1 className="text-2xl font-bold">{profile.display_name}</h1>
                  )}
                  <p className="text-muted-foreground">@{profile.username}</p>
                </div>

                <div className="flex gap-2">
                  <FollowButton
                    targetUsername={profile.username}
                    currentUser={currentUser ? { username: currentUser.username } : undefined}
                    onFollowChange={handleFollowChange}
                  />

                  {isOwnProfile && (
                    <>
                      {isEditing ? (
                        <>
                          <Button size="sm" onClick={handleSave} disabled={isSaving}>
                            <Save className="h-4 w-4 mr-2" />
                            {isSaving ? "Saving..." : "Save"}
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                            <X className="h-4 w-4 mr-2" />
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <Button size="sm" onClick={() => setIsEditing(true)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Profile
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                {isEditing ? (
                  <Textarea
                    value={editForm.bio}
                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                    placeholder="Tell us about yourself..."
                    className="resize-none"
                  />
                ) : (
                  <p className="text-muted-foreground">{profile.bio || "No bio available"}</p>
                )}
              </div>

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Joined {formatDistanceToNow(new Date(profile.created_at))} ago
                </div>
              </div>

              <div className="flex gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold">{profile.posts_count}</div>
                  <div className="text-sm text-muted-foreground">Posts</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{profile.followers_count}</div>
                  <div className="text-sm text-muted-foreground">Followers</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{profile.following_count}</div>
                  <div className="text-sm text-muted-foreground">Following</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Tabs */}
      <Tabs defaultValue="posts" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="liked">Liked</TabsTrigger>
          <TabsTrigger value="media">Media</TabsTrigger>
        </TabsList>
        <TabsContent value="posts" className="space-y-4">
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground">Posts will be displayed here</p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="liked" className="space-y-4">
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground">Liked posts will be displayed here</p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="media" className="space-y-4">
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground">Media posts will be displayed here</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
