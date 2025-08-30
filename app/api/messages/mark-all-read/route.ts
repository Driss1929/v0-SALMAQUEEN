import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

// PUT /api/messages/mark-all-read - Mark all messages as read for a user
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { currentUser, otherUser } = body

    if (!currentUser || !otherUser) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    const supabase = await createClient()

    // Set the current user context for RLS
    await supabase.rpc("set_config", {
      parameter: "app.current_user",
      value: currentUser,
    })

    // Mark all messages from otherUser to currentUser as read
    const { data: messages, error } = await supabase
      .from("messages")
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq("sender_username", otherUser)
      .eq("receiver_username", currentUser)
      .eq("is_read", false)
      .select()

    if (error) {
      console.error("Error marking messages as read:", error)
      return NextResponse.json({ error: "Failed to mark messages as read" }, { status: 500 })
    }

    return NextResponse.json({ messages })
  } catch (error) {
    console.error("Error in PUT /api/messages/mark-all-read:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
