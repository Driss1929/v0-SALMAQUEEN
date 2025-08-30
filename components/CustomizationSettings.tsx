"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Palette, Heart, Bell, Moon, Sun, Sparkles, Users } from "lucide-react"

interface ThemeSettings {
  colorScheme: "romantic" | "ocean" | "sunset" | "forest" | "lavender"
  darkMode: boolean
  fontSize: number
  animations: boolean
  soundEffects: boolean
  notifications: {
    moodReminders: boolean
    specialDays: boolean
    voiceMemories: boolean
    bucketList: boolean
  }
  privacy: {
    shareLocation: boolean
    publicProfile: boolean
    allowAIAnalysis: boolean
  }
}

const colorSchemes = [
  {
    id: "romantic",
    name: "Romantic Rose",
    description: "Warm pinks and soft roses",
    colors: ["#fdf2f8", "#fce7f3", "#f9a8d4", "#ec4899"],
    gradient: "from-rose-100 to-pink-200",
  },
  {
    id: "ocean",
    name: "Ocean Breeze",
    description: "Cool blues and teals",
    colors: ["#f0fdfa", "#ccfbf1", "#5eead4", "#0d9488"],
    gradient: "from-teal-100 to-cyan-200",
  },
  {
    id: "sunset",
    name: "Golden Sunset",
    description: "Warm oranges and yellows",
    colors: ["#fffbeb", "#fef3c7", "#fbbf24", "#f59e0b"],
    gradient: "from-amber-100 to-orange-200",
  },
  {
    id: "forest",
    name: "Forest Green",
    description: "Natural greens and earth tones",
    colors: ["#f0fdf4", "#dcfce7", "#86efac", "#22c55e"],
    gradient: "from-green-100 to-emerald-200",
  },
  {
    id: "lavender",
    name: "Lavender Dreams",
    description: "Soft purples and lilacs",
    colors: ["#faf5ff", "#f3e8ff", "#c084fc", "#a855f7"],
    gradient: "from-purple-100 to-violet-200",
  },
]

export default function CustomizationSettings() {
  const [settings, setSettings] = useState<ThemeSettings>({
    colorScheme: "romantic",
    darkMode: false,
    fontSize: 16,
    animations: true,
    soundEffects: true,
    notifications: {
      moodReminders: true,
      specialDays: true,
      voiceMemories: false,
      bucketList: true,
    },
    privacy: {
      shareLocation: false,
      publicProfile: false,
      allowAIAnalysis: true,
    },
  })

  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem("relationshipAppSettings")
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings))
    }
  }, [])

  const saveSettings = async () => {
    setIsSaving(true)
    try {
      localStorage.setItem("relationshipAppSettings", JSON.stringify(settings))
      // Apply theme changes to document
      document.documentElement.setAttribute("data-theme", settings.colorScheme)
      document.documentElement.setAttribute("data-dark-mode", settings.darkMode.toString())
      document.documentElement.style.fontSize = `${settings.fontSize}px`

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
    } catch (error) {
      console.error("Error saving settings:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const updateSetting = (key: string, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const updateNestedSetting = (category: string, key: string, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [category]: {
        ...prev[category as keyof ThemeSettings],
        [key]: value,
      },
    }))
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 text-2xl font-bold text-gray-900">
          <Palette className="w-6 h-6 text-purple-500" />
          Customization & Themes
          <Sparkles className="w-6 h-6 text-pink-500" />
        </div>
        <p className="text-gray-600">Personalize your relationship app experience</p>
      </div>

      {/* Color Schemes */}
      <Card className="border-2 border-purple-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-purple-500" />
            Color Scheme
          </CardTitle>
          <CardDescription>Choose a color theme that reflects your relationship vibe</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {colorSchemes.map((scheme) => (
              <div
                key={scheme.id}
                className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  settings.colorScheme === scheme.id
                    ? "border-purple-400 ring-2 ring-purple-200"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => updateSetting("colorScheme", scheme.id)}
              >
                <div className={`h-16 rounded-lg bg-gradient-to-r ${scheme.gradient} mb-3`}>
                  <div className="flex h-full items-center justify-center">
                    <div className="flex gap-1">
                      {scheme.colors.map((color, index) => (
                        <div
                          key={index}
                          className="w-3 h-3 rounded-full border border-white/50"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900">{scheme.name}</h3>
                <p className="text-sm text-gray-600">{scheme.description}</p>
                {settings.colorScheme === scheme.id && (
                  <Badge className="absolute top-2 right-2 bg-purple-500">
                    <Heart className="w-3 h-3 mr-1" />
                    Active
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Display Settings */}
      <Card className="border-2 border-blue-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {settings.darkMode ? (
              <Moon className="w-5 h-5 text-blue-500" />
            ) : (
              <Sun className="w-5 h-5 text-yellow-500" />
            )}
            Display Settings
          </CardTitle>
          <CardDescription>Adjust visual preferences for comfort</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">Dark Mode</Label>
              <p className="text-sm text-gray-600">Switch to dark theme for low-light environments</p>
            </div>
            <Switch checked={settings.darkMode} onCheckedChange={(checked) => updateSetting("darkMode", checked)} />
          </div>

          <div className="space-y-3">
            <Label className="text-base font-medium">Font Size: {settings.fontSize}px</Label>
            <Slider
              value={[settings.fontSize]}
              onValueChange={(value) => updateSetting("fontSize", value[0])}
              min={12}
              max={24}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-gray-500">
              <span>Small</span>
              <span>Medium</span>
              <span>Large</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">Smooth Animations</Label>
              <p className="text-sm text-gray-600">Enable transitions and motion effects</p>
            </div>
            <Switch checked={settings.animations} onCheckedChange={(checked) => updateSetting("animations", checked)} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">Sound Effects</Label>
              <p className="text-sm text-gray-600">Play sounds for interactions and notifications</p>
            </div>
            <Switch
              checked={settings.soundEffects}
              onCheckedChange={(checked) => updateSetting("soundEffects", checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card className="border-2 border-green-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-green-500" />
            Notification Preferences
          </CardTitle>
          <CardDescription>Choose what reminders and alerts you want to receive</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">Mood Check-in Reminders</Label>
              <p className="text-sm text-gray-600">Daily reminders to log your mood</p>
            </div>
            <Switch
              checked={settings.notifications.moodReminders}
              onCheckedChange={(checked) => updateNestedSetting("notifications", "moodReminders", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">Special Days Alerts</Label>
              <p className="text-sm text-gray-600">Reminders for anniversaries and important dates</p>
            </div>
            <Switch
              checked={settings.notifications.specialDays}
              onCheckedChange={(checked) => updateNestedSetting("notifications", "specialDays", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">Voice Memory Prompts</Label>
              <p className="text-sm text-gray-600">Suggestions to record new voice memories</p>
            </div>
            <Switch
              checked={settings.notifications.voiceMemories}
              onCheckedChange={(checked) => updateNestedSetting("notifications", "voiceMemories", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">Bucket List Updates</Label>
              <p className="text-sm text-gray-600">Notifications when goals are completed</p>
            </div>
            <Switch
              checked={settings.notifications.bucketList}
              onCheckedChange={(checked) => updateNestedSetting("notifications", "bucketList", checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Privacy Settings */}
      <Card className="border-2 border-rose-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-rose-500" />
            Privacy & Data
          </CardTitle>
          <CardDescription>Control how your data is used and shared</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">Share Location Data</Label>
              <p className="text-sm text-gray-600">Allow location-based features and memories</p>
            </div>
            <Switch
              checked={settings.privacy.shareLocation}
              onCheckedChange={(checked) => updateNestedSetting("privacy", "shareLocation", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">Public Profile</Label>
              <p className="text-sm text-gray-600">Make your relationship milestones visible to others</p>
            </div>
            <Switch
              checked={settings.privacy.publicProfile}
              onCheckedChange={(checked) => updateNestedSetting("privacy", "publicProfile", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">AI Analysis</Label>
              <p className="text-sm text-gray-600">Allow AI to analyze patterns for better suggestions</p>
            </div>
            <Switch
              checked={settings.privacy.allowAIAnalysis}
              onCheckedChange={(checked) => updateNestedSetting("privacy", "allowAIAnalysis", checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-center pt-4">
        <Button
          onClick={saveSettings}
          disabled={isSaving}
          size="lg"
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8"
        >
          {isSaving ? "Saving..." : "Save All Settings"}
        </Button>
      </div>
    </div>
  )
}
