"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Textarea } from "./ui/textarea"
import { Badge } from "./ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useAuth } from "../contexts/AuthContext"

interface GalleryItem {
  id: string
  user_id: string
  title: string
  caption?: string
  media_url: string
  media_type: "image" | "video"
  special_date?: string
  created_at: string
  user?: {
    username: string
  }
}

export default function SharedGallery() {
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([])
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [title, setTitle] = useState("")
  const [caption, setCaption] = useState("")
  const [specialDate, setSpecialDate] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null)
  const [filter, setFilter] = useState<"all" | "images" | "videos">("all")

  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClientComponentClient()
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      fetchGalleryItems()
    }
  }, [user])

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  const fetchGalleryItems = async () => {
    if (!user) return

    const { data, error } = await supabase
      .from("gallery_items")
      .select(`
        *,
        user:users(username)
      `)
      .order("created_at", { ascending: false })

    if (data) {
      setGalleryItems(data)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "video/mp4", "video/webm", "video/mov"]
    if (!validTypes.includes(file.type)) {
      alert("Please select a valid image or video file")
      return
    }

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      alert("File size must be less than 50MB")
      return
    }

    setSelectedFile(file)

    // Create preview URL
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    const newPreviewUrl = URL.createObjectURL(file)
    setPreviewUrl(newPreviewUrl)
  }

  const uploadMedia = async () => {
    if (!selectedFile || !title.trim() || !user) return

    setIsLoading(true)

    try {
      // Upload file to storage
      const fileExt = selectedFile.name.split(".").pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `${user.id}/${fileName}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("gallery")
        .upload(filePath, selectedFile)

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage.from("gallery").getPublicUrl(filePath)

      // Save to database
      const mediaType = selectedFile.type.startsWith("image/") ? "image" : "video"
      const itemData = {
        user_id: user.id,
        title: title.trim(),
        caption: caption.trim() || null,
        media_url: urlData.publicUrl,
        media_type: mediaType,
        special_date: specialDate || null,
      }

      const { error: dbError } = await supabase.from("gallery_items").insert(itemData)

      if (dbError) throw dbError

      // Reset form
      setSelectedFile(null)
      setPreviewUrl(null)
      setTitle("")
      setCaption("")
      setSpecialDate("")
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }

      await fetchGalleryItems()
    } catch (error) {
      console.error("Error uploading media:", error)
      alert("Failed to upload media. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const filteredItems = galleryItems.filter((item) => {
    if (filter === "all") return true
    if (filter === "images") return item.media_type === "image"
    if (filter === "videos") return item.media_type === "video"
    return true
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center text-primary">Add to Gallery</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* File Upload */}
          <div className="space-y-4">
            <div className="flex flex-col items-center space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                size="lg"
                className="w-full h-32 border-2 border-dashed border-border hover:border-primary transition-colors"
              >
                <div className="text-center">
                  <div className="text-4xl mb-2">📸</div>
                  <p className="text-lg font-semibold">Choose Photo or Video</p>
                  <p className="text-sm text-muted-foreground">Max 50MB • JPG, PNG, GIF, MP4, WebM</p>
                </div>
              </Button>
            </div>

            {/* Preview */}
            {previewUrl && selectedFile && (
              <div className="space-y-4 animate-fade-in">
                <div className="relative rounded-xl overflow-hidden bg-background border border-border">
                  {selectedFile.type.startsWith("image/") ? (
                    <img src={previewUrl || "/placeholder.svg"} alt="Preview" className="w-full h-64 object-cover" />
                  ) : (
                    <video src={previewUrl} controls className="w-full h-64 object-cover" />
                  )}
                </div>

                {/* Media Details Form */}
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Title *</label>
                    <Input
                      placeholder="Give your memory a title..."
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="bg-background/50"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Caption</label>
                    <Textarea
                      placeholder="Add a caption or story..."
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      className="resize-none bg-background/50"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Special Date (optional)</label>
                    <Input
                      type="date"
                      value={specialDate}
                      onChange={(e) => setSpecialDate(e.target.value)}
                      className="bg-background/50"
                    />
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      onClick={uploadMedia}
                      disabled={!title.trim() || isLoading}
                      className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 rounded-xl transition-all duration-200 hover:shadow-lg"
                    >
                      {isLoading ? "Uploading..." : "Add to Gallery"}
                    </Button>
                    <Button
                      onClick={() => {
                        setSelectedFile(null)
                        setPreviewUrl(null)
                        setTitle("")
                        setCaption("")
                        setSpecialDate("")
                        if (fileInputRef.current) {
                          fileInputRef.current.value = ""
                        }
                      }}
                      variant="outline"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Gallery Section */}
      <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl text-primary">Shared Gallery</CardTitle>
            <div className="flex space-x-2">
              <Button variant={filter === "all" ? "default" : "outline"} size="sm" onClick={() => setFilter("all")}>
                All
              </Button>
              <Button
                variant={filter === "images" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("images")}
              >
                Photos
              </Button>
              <Button
                variant={filter === "videos" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("videos")}
              >
                Videos
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredItems.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {filter === "all" ? "No memories yet. Upload your first photo or video!" : `No ${filter} found.`}
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredItems.map((item) => (
                <Dialog key={item.id}>
                  <DialogTrigger asChild>
                    <div className="group cursor-pointer rounded-xl overflow-hidden bg-background border border-border hover:shadow-lg transition-all duration-200 hover:scale-105">
                      <div className="relative aspect-square">
                        {item.media_type === "image" ? (
                          <img
                            src={item.media_url || "/placeholder.svg"}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="relative w-full h-full">
                            <video src={item.media_url} className="w-full h-full object-cover" muted />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                              <div className="w-12 h-12 bg-white/80 rounded-full flex items-center justify-center">
                                <span className="text-xl">▶️</span>
                              </div>
                            </div>
                          </div>
                        )}
                        <div className="absolute top-2 right-2">
                          <Badge variant="secondary" className="text-xs">
                            {item.media_type === "image" ? "📸" : "🎥"}
                          </Badge>
                        </div>
                      </div>
                      <div className="p-3">
                        <h3 className="font-semibold text-foreground truncate">{item.title}</h3>
                        <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                          <span>By {item.user?.username || "Unknown"}</span>
                          <span>{formatDate(item.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
                    <DialogHeader>
                      <DialogTitle className="text-xl">{item.title}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="rounded-xl overflow-hidden">
                        {item.media_type === "image" ? (
                          <img
                            src={item.media_url || "/placeholder.svg"}
                            alt={item.title}
                            className="w-full max-h-96 object-contain"
                          />
                        ) : (
                          <video src={item.media_url} controls className="w-full max-h-96" />
                        )}
                      </div>
                      {item.caption && <p className="text-foreground">{item.caption}</p>}
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>Uploaded by {item.user?.username || "Unknown"}</span>
                        <span>{formatDate(item.created_at)}</span>
                      </div>
                      {item.special_date && (
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">Special Date: {formatDate(item.special_date)}</Badge>
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
