"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Heart, Sparkles, MessageCircle, Calendar, Users, Lightbulb } from "lucide-react"

interface Suggestion {
  id: string
  category: "communication" | "activities" | "intimacy" | "growth" | "conflict"
  title: string
  description: string
  actionable: boolean
}

export default function AIRelationshipCoach() {
  const [question, setQuestion] = useState("")
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [activeCategory, setActiveCategory] = useState<string>("all")

  const categories = [
    { id: "all", label: "All Suggestions", icon: Sparkles },
    { id: "communication", label: "Communication", icon: MessageCircle },
    { id: "activities", label: "Date Ideas", icon: Calendar },
    { id: "intimacy", label: "Intimacy", icon: Heart },
    { id: "growth", label: "Growth", icon: Users },
    { id: "conflict", label: "Conflict Resolution", icon: Lightbulb },
  ]

  const getCategoryColor = (category: string) => {
    const colors = {
      communication: "bg-blue-100 text-blue-800 border-blue-200",
      activities: "bg-purple-100 text-purple-800 border-purple-200",
      intimacy: "bg-rose-100 text-rose-800 border-rose-200",
      growth: "bg-emerald-100 text-emerald-800 border-emerald-200",
      conflict: "bg-amber-100 text-amber-800 border-amber-200",
    }
    return colors[category as keyof typeof colors] || "bg-gray-100 text-gray-800 border-gray-200"
  }

  const getAdvice = async () => {
    if (!question.trim()) return

    setIsLoading(true)
    try {
      const response = await fetch("/api/ai/relationship-advice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      })

      if (!response.ok) throw new Error("Failed to get advice")

      const data = await response.json()
      setSuggestions(data.suggestions)
    } catch (error) {
      console.error("Error getting advice:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getGeneralSuggestions = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/ai/relationship-advice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: "general relationship tips" }),
      })

      if (!response.ok) throw new Error("Failed to get suggestions")

      const data = await response.json()
      setSuggestions(data.suggestions)
    } catch (error) {
      console.error("Error getting suggestions:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredSuggestions =
    activeCategory === "all" ? suggestions : suggestions.filter((s) => s.category === activeCategory)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 text-2xl font-bold text-gray-900">
          <Heart className="w-6 h-6 text-rose-500" />
          AI Relationship Coach
          <Sparkles className="w-6 h-6 text-cyan-500" />
        </div>
        <p className="text-gray-600">Get personalized advice to strengthen your relationship</p>
      </div>

      {/* Ask Question */}
      <Card className="border-2 border-rose-100">
        <CardHeader>
          <CardTitle className="text-lg">Ask Your Coach</CardTitle>
          <CardDescription>Share what's on your mind or get general relationship tips</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="How can we improve our communication? What are some fun date ideas? How do we handle disagreements better?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="min-h-[100px] resize-none"
          />
          <div className="flex gap-2">
            <Button
              onClick={getAdvice}
              disabled={isLoading || !question.trim()}
              className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600"
            >
              {isLoading ? "Getting Advice..." : "Get Personalized Advice"}
            </Button>
            <Button
              variant="outline"
              onClick={getGeneralSuggestions}
              disabled={isLoading}
              className="border-cyan-200 text-cyan-700 hover:bg-cyan-50 bg-transparent"
            >
              Get General Tips
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Category Filter */}
      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => {
            const Icon = category.icon
            const isActive = activeCategory === category.id
            return (
              <Button
                key={category.id}
                variant={isActive ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveCategory(category.id)}
                className={
                  isActive
                    ? "bg-gradient-to-r from-cyan-500 to-emerald-500 text-white"
                    : "border-gray-200 text-gray-700 hover:bg-gray-50"
                }
              >
                <Icon className="w-4 h-4 mr-1" />
                {category.label}
              </Button>
            )
          })}
        </div>
      )}

      {/* Suggestions */}
      {filteredSuggestions.length > 0 && (
        <div className="grid gap-4">
          {filteredSuggestions.map((suggestion) => (
            <Card key={suggestion.id} className="border-l-4 border-l-cyan-400 hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg text-gray-900">{suggestion.title}</CardTitle>
                  <Badge variant="outline" className={getCategoryColor(suggestion.category)}>
                    {suggestion.category}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">{suggestion.description}</p>
                {suggestion.actionable && (
                  <div className="mt-3 flex items-center gap-2 text-sm text-emerald-600">
                    <Lightbulb className="w-4 h-4" />
                    <span className="font-medium">Actionable tip - try this today!</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {suggestions.length === 0 && !isLoading && (
        <Card className="text-center py-12 border-dashed border-2 border-gray-200">
          <CardContent>
            <Heart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to Strengthen Your Bond?</h3>
            <p className="text-gray-600 mb-4">Ask a question or get general relationship tips to get started</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
