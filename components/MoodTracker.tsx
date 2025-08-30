"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Textarea } from "./ui/textarea"
import { Calendar } from "./ui/calendar"
import { createBrowserClient } from "@supabase/ssr"
import { useAuth } from "../contexts/AuthContext"

const MOODS = [
  { emoji: "😊", name: "Happy", color: "bg-yellow-200 hover:bg-yellow-300" },
  { emoji: "😍", name: "In Love", color: "bg-pink-200 hover:bg-pink-300" },
  { emoji: "😌", name: "Peaceful", color: "bg-green-200 hover:bg-green-300" },
  { emoji: "😴", name: "Tired", color: "bg-blue-200 hover:bg-blue-300" },
  { emoji: "😢", name: "Sad", color: "bg-gray-200 hover:bg-gray-300" },
  { emoji: "😤", name: "Stressed", color: "bg-red-200 hover:bg-red-300" },
  { emoji: "🤗", name: "Grateful", color: "bg-purple-200 hover:bg-purple-300" },
  { emoji: "😐", name: "Neutral", color: "bg-slate-200 hover:bg-slate-300" },
]

interface MoodEntry {
  id: string
  user_id: string
  mood: string
  mood_emoji: string
  note?: string
  created_at: string
}

export default function MoodTracker() {
  const [selectedMood, setSelectedMood] = useState<(typeof MOODS)[0] | null>(null)
  const [note, setNote] = useState("")
  const [todaysMood, setTodaysMood] = useState<MoodEntry | null>(null)
  const [partnerMood, setPartnerMood] = useState<MoodEntry | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      fetchTodaysMoods()
    }
  }, [user, selectedDate])

  const fetchTodaysMoods = async () => {
    if (!user) return

    const today = selectedDate.toISOString().split("T")[0]

    // Fetch user's mood for selected date
    const { data: userMood } = await supabase
      .from("moods")
      .select("*")
      .eq("user_id", user.id)
      .gte("created_at", `${today}T00:00:00`)
      .lt("created_at", `${today}T23:59:59`)
      .single()

    setTodaysMood(userMood)

    // Fetch partner's mood (assuming there are only 2 users)
    const { data: allUsers } = await supabase.from("users").select("id").neq("id", user.id).limit(1)

    if (allUsers && allUsers.length > 0) {
      const partnerId = allUsers[0].id
      const { data: partnerMoodData } = await supabase
        .from("moods")
        .select("*")
        .eq("user_id", partnerId)
        .gte("created_at", `${today}T00:00:00`)
        .lt("created_at", `${today}T23:59:59`)
        .single()

      setPartnerMood(partnerMoodData)
    }
  }

  const saveMood = async () => {
    if (!selectedMood || !user) return

    setIsLoading(true)

    const today = new Date().toISOString().split("T")[0]

    try {
      if (todaysMood) {
        // Update existing mood
        await supabase
          .from("moods")
          .update({
            mood: selectedMood.name,
            mood_emoji: selectedMood.emoji,
            note: note || null,
          })
          .eq("id", todaysMood.id)
      } else {
        // Create new mood entry
        await supabase.from("moods").insert({
          user_id: user.id,
          mood: selectedMood.name,
          mood_emoji: selectedMood.emoji,
          note: note || null,
        })
      }

      await fetchTodaysMoods()
      setNote("")
      setSelectedMood(null)
    } catch (error) {
      console.error("Error saving mood:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center text-primary">How are you feeling today?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Mood Selection Grid */}
          <div className="grid grid-cols-4 gap-3">
            {MOODS.map((mood) => (
              <Button
                key={mood.name}
                variant={selectedMood?.name === mood.name ? "default" : "outline"}
                className={`h-16 flex flex-col items-center justify-center space-y-1 transition-all duration-200 ${
                  selectedMood?.name === mood.name
                    ? "bg-primary text-primary-foreground shadow-lg scale-105"
                    : `${mood.color} border-2 hover:scale-105`
                }`}
                onClick={() => setSelectedMood(mood)}
              >
                <span className="text-2xl">{mood.emoji}</span>
                <span className="text-xs font-medium">{mood.name}</span>
              </Button>
            ))}
          </div>

          {/* Note Input */}
          {selectedMood && (
            <div className="space-y-2 animate-fade-in">
              <label className="text-sm font-medium text-muted-foreground">Add a note (optional)</label>
              <Textarea
                placeholder="What's on your mind?"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="resize-none bg-background/50"
                rows={3}
              />
            </div>
          )}

          {/* Save Button */}
          {selectedMood && (
            <Button
              onClick={saveMood}
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 rounded-xl transition-all duration-200 hover:shadow-lg"
            >
              {isLoading ? "Saving..." : todaysMood ? "Update Mood" : "Save Mood"}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Today's Moods Display */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Your Mood */}
        <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-primary">Your Mood</CardTitle>
          </CardHeader>
          <CardContent>
            {todaysMood ? (
              <div className="flex items-center space-x-3">
                <span className="text-3xl">{todaysMood.mood_emoji}</span>
                <div>
                  <p className="font-semibold text-foreground">{todaysMood.mood}</p>
                  {todaysMood.note && <p className="text-sm text-muted-foreground mt-1">{todaysMood.note}</p>}
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">No mood logged yet</p>
            )}
          </CardContent>
        </Card>

        {/* Partner's Mood */}
        <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-primary">Partner's Mood</CardTitle>
          </CardHeader>
          <CardContent>
            {partnerMood ? (
              <div className="flex items-center space-x-3">
                <span className="text-3xl">{partnerMood.mood_emoji}</span>
                <div>
                  <p className="font-semibold text-foreground">{partnerMood.mood}</p>
                  {partnerMood.note && <p className="text-sm text-muted-foreground mt-1">{partnerMood.note}</p>}
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">No mood logged yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Calendar View */}
      <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-xl text-primary">Mood Calendar</CardTitle>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && setSelectedDate(date)}
            className="rounded-md border-0"
          />
        </CardContent>
      </Card>
    </div>
  )
}
