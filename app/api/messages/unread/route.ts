import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

// GET /api/messages/unread - Get unread message count
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const currentUser = searchParams.get("currentUser")

    if (!currentUser) {
      return NextResponse.json({ error: "Missing currentUser parameter" }, { status: 400 })
    }

    const supabase = await createClient()

    // Set the current user context for RLS
    await supabase.rpc("set_config", {
      parameter: "app.current_user",
      value: currentUser,
    })

    // Get unread messages count
    const { count, error } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("receiver_username", currentUser)
      .eq("is_read", false)

    if (error) {
      console.error("Error fetching unread messages count:", error)
      return NextResponse.json({ error: "Failed to fetch unread messages count" }, { status: 500 })
    }

    return NextResponse.json({ unreadCount: count || 0 })
  } catch (error) {
    console.error("Error in GET /api/messages/unread:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
