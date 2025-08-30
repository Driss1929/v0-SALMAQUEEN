import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

// PUT /api/messages/[id]/read - Mark message as read
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const body = await request.json()
    const { currentUser } = body

    if (!currentUser) {
      return NextResponse.json({ error: "Missing currentUser" }, { status: 400 })
    }

    const supabase = await createClient()

    // Set the current user context for RLS
    await supabase.rpc("set_config", {
      parameter: "app.current_user",
      value: currentUser,
    })

    // Mark message as read (only if the current user is the receiver)
    const { data: message, error } = await supabase
      .from("messages")
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("receiver_username", currentUser)
      .select()
      .single()

    if (error) {
      console.error("Error marking message as read:", error)
      return NextResponse.json({ error: "Failed to mark message as read" }, { status: 500 })
    }

    return NextResponse.json({ message })
  } catch (error) {
    console.error("Error in PUT /api/messages/[id]/read:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
