"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Textarea } from "./ui/textarea"
import { Badge } from "./ui/badge"
import { createBrowserClient } from "@supabase/ssr"
import { useAuth } from "../contexts/AuthContext"

interface VoiceMemory {
  id: string
  user_id: string
  title: string
  description?: string
  audio_url: string
  duration: number
  is_time_capsule: boolean
  unlock_date?: string
  photo_url?: string
  created_at: string
  user?: {
    username: string
  }
}

export default function VoiceMemories() {
  const [memories, setMemories] = useState<VoiceMemory[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [isTimeCapsule, setIsTimeCapsule] = useState(false)
  const [unlockDate, setUnlockDate] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [playingId, setPlayingId] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      fetchMemories()
    }
  }, [user])

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      if (audioRef.current) {
        audioRef.current.pause()
      }
    }
  }, [])

  const fetchMemories = async () => {
    if (!user) return

    const { data, error } = await supabase
      .from("voice_memories")
      .select(`
        *,
        user:users(username)
      `)
      .order("created_at", { ascending: false })

    if (data) {
      // Filter out locked time capsules
      const availableMemories = data.filter((memory) => {
        if (!memory.is_time_capsule) return true
        if (!memory.unlock_date) return true
        return new Date(memory.unlock_date) <= new Date()
      })
      setMemories(availableMemories)
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data)
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" })
        setAudioBlob(audioBlob)
        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)

      intervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)
    } catch (error) {
      console.error("Error starting recording:", error)
      alert("Could not access microphone. Please check permissions.")
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }

  const saveMemory = async () => {
    if (!audioBlob || !title.trim() || !user) return

    setIsLoading(true)

    try {
      // Upload audio file
      const audioFileName = `voice-memory-${Date.now()}.wav`
      const { data: audioUpload, error: audioError } = await supabase.storage
        .from("voice-memories")
        .upload(audioFileName, audioBlob)

      if (audioError) throw audioError

      const { data: audioUrl } = supabase.storage.from("voice-memories").getPublicUrl(audioFileName)

      // Save memory to database
      const memoryData = {
        user_id: user.id,
        title: title.trim(),
        description: description.trim() || null,
        audio_url: audioUrl.publicUrl,
        duration: recordingTime,
        is_time_capsule: isTimeCapsule,
        unlock_date: isTimeCapsule && unlockDate ? unlockDate : null,
      }

      const { error: dbError } = await supabase.from("voice_memories").insert(memoryData)

      if (dbError) throw dbError

      // Reset form
      setAudioBlob(null)
      setTitle("")
      setDescription("")
      setIsTimeCapsule(false)
      setUnlockDate("")
      setRecordingTime(0)

      await fetchMemories()
    } catch (error) {
      console.error("Error saving memory:", error)
      alert("Failed to save voice memory. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const playAudio = (memory: VoiceMemory) => {
    if (playingId === memory.id) {
      // Stop current audio
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
      }
      setPlayingId(null)
    } else {
      // Play new audio
      if (audioRef.current) {
        audioRef.current.pause()
      }

      const audio = new Audio(memory.audio_url)
      audioRef.current = audio

      audio.onended = () => {
        setPlayingId(null)
      }

      audio.onerror = () => {
        console.error("Error playing audio")
        setPlayingId(null)
      }

      audio.play()
      setPlayingId(memory.id)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="space-y-6">
      {/* Recording Section */}
      <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center text-primary">Create Voice Memory</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Recording Controls */}
          <div className="flex flex-col items-center space-y-4">
            {!audioBlob ? (
              <div className="flex flex-col items-center space-y-4">
                <Button
                  onClick={isRecording ? stopRecording : startRecording}
                  size="lg"
                  className={`w-24 h-24 rounded-full text-2xl transition-all duration-200 ${
                    isRecording
                      ? "bg-red-500 hover:bg-red-600 animate-pulse"
                      : "bg-primary hover:bg-primary/90 hover:scale-105"
                  }`}
                >
                  {isRecording ? "⏹️" : "🎤"}
                </Button>
                {isRecording && (
                  <div className="text-center animate-fade-in">
                    <p className="text-lg font-semibold text-primary">Recording...</p>
                    <p className="text-2xl font-mono text-accent">{formatTime(recordingTime)}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-4 animate-fade-in">
                <div className="flex items-center space-x-4">
                  <Button
                    onClick={() => {
                      const audio = new Audio(URL.createObjectURL(audioBlob))
                      audio.play()
                    }}
                    variant="outline"
                    size="lg"
                    className="rounded-full"
                  >
                    ▶️
                  </Button>
                  <span className="text-lg font-semibold">Recording: {formatTime(recordingTime)}</span>
                  <Button
                    onClick={() => {
                      setAudioBlob(null)
                      setRecordingTime(0)
                    }}
                    variant="outline"
                    size="sm"
                  >
                    🗑️ Delete
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Memory Details Form */}
          {audioBlob && (
            <div className="space-y-4 animate-fade-in">
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
                <label className="text-sm font-medium text-muted-foreground">Description (optional)</label>
                <Textarea
                  placeholder="Add a description or context..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="resize-none bg-background/50"
                  rows={2}
                />
              </div>

              {/* Time Capsule Option */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="timeCapsule"
                  checked={isTimeCapsule}
                  onChange={(e) => setIsTimeCapsule(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="timeCapsule" className="text-sm font-medium">
                  Lock as time capsule
                </label>
              </div>

              {isTimeCapsule && (
                <div className="animate-fade-in">
                  <label className="text-sm font-medium text-muted-foreground">Unlock Date</label>
                  <Input
                    type="datetime-local"
                    value={unlockDate}
                    onChange={(e) => setUnlockDate(e.target.value)}
                    className="bg-background/50"
                  />
                </div>
              )}

              <Button
                onClick={saveMemory}
                disabled={!title.trim() || isLoading}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 rounded-xl transition-all duration-200 hover:shadow-lg"
              >
                {isLoading ? "Saving..." : "Save Memory"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Memories Timeline */}
      <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-xl text-primary">Voice Memories Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          {memories.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No voice memories yet. Create your first one!</p>
          ) : (
            <div className="space-y-4">
              {memories.map((memory) => (
                <div
                  key={memory.id}
                  className="flex items-center space-x-4 p-4 rounded-xl bg-background/50 border border-border hover:shadow-md transition-all duration-200"
                >
                  <Button
                    onClick={() => playAudio(memory)}
                    variant="outline"
                    size="sm"
                    className={`rounded-full w-12 h-12 ${
                      playingId === memory.id ? "bg-primary text-primary-foreground" : ""
                    }`}
                  >
                    {playingId === memory.id ? "⏸️" : "▶️"}
                  </Button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-semibold text-foreground truncate">{memory.title}</h3>
                      {memory.is_time_capsule && (
                        <Badge variant="secondary" className="text-xs">
                          🔒 Time Capsule
                        </Badge>
                      )}
                    </div>
                    {memory.description && <p className="text-sm text-muted-foreground mb-1">{memory.description}</p>}
                    <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                      <span>Duration: {formatTime(memory.duration)}</span>
                      <span>By: {memory.user?.username || "Unknown"}</span>
                      <span>{formatDate(memory.created_at)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
