import { type NextRequest, NextResponse } from "next/server"
import { generateObject } from "ai"
import { groq } from "@ai-sdk/groq"
import { z } from "zod"

const suggestionSchema = z.object({
  suggestions: z.array(
    z.object({
      id: z.string(),
      category: z.enum(["communication", "activities", "intimacy", "growth", "conflict"]),
      title: z.string(),
      description: z.string(),
      actionable: z.boolean(),
    }),
  ),
})

export async function POST(request: NextRequest) {
  try {
    const { question } = await request.json()

    if (!question) {
      return NextResponse.json({ error: "Question is required" }, { status: 400 })
    }

    const prompt = question.toLowerCase().includes("general")
      ? `Generate 5-6 diverse relationship advice suggestions covering different aspects of a healthy relationship. Include communication tips, date ideas, intimacy advice, personal growth, and conflict resolution. Make them practical and actionable for couples.`
      : `Based on this relationship question: "${question}"

Provide 3-5 helpful, practical suggestions that directly address their concern. Focus on actionable advice that couples can implement. Consider different aspects like communication, activities, emotional connection, and problem-solving.`

    const { object } = await generateObject({
      model: groq("llama-3.1-70b-versatile"),
      schema: suggestionSchema,
      prompt: `${prompt}

Format each suggestion with:
- A unique ID (use random string)
- Appropriate category (communication, activities, intimacy, growth, or conflict)
- Clear, engaging title
- Detailed, practical description (2-3 sentences)
- Whether it's immediately actionable (true/false)

Make the advice warm, supportive, and relationship-focused. Avoid generic advice - be specific and helpful.`,
    })

    return NextResponse.json(object)
  } catch (error) {
    console.error("Error generating relationship advice:", error)
    return NextResponse.json({ error: "Failed to generate advice" }, { status: 500 })
  }
}
