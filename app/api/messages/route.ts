import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

// GET /api/messages - Get messages for a conversation
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const currentUser = searchParams.get("currentUser")
    const otherUser = searchParams.get("otherUser")

    if (!currentUser || !otherUser) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    const supabase = await createClient()

    // Set the current user context for RLS
    await supabase.rpc("set_config", {
      parameter: "app.current_user",
      value: currentUser,
    })

    // Get messages between the two users
    const { data: messages, error } = await supabase
      .from("messages")
      .select(`
        id,
        sender_username,
        receiver_username,
        content,
        message_type,
        media_url,
        media_name,
        media_size,
        is_read,
        delivered_at,
        read_at,
        created_at
      `)
      .or(
        `and(sender_username.eq.${currentUser},receiver_username.eq.${otherUser}),and(sender_username.eq.${otherUser},receiver_username.eq.${currentUser})`,
      )
      .order("created_at", { ascending: true })

    if (error) {
      console.error("Error fetching messages:", error)
      return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
    }

    return NextResponse.json({ messages })
  } catch (error) {
    console.error("Error in GET /api/messages:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/messages - Create a new message
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sender_username, receiver_username, content, message_type, media_url, media_name, media_size } = body

    if (!sender_username || !receiver_username || (!content && !media_url)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = await createClient()

    // Set the current user context for RLS
    await supabase.rpc("set_config", {
      parameter: "app.current_user",
      value: sender_username,
    })

    // Create the message
    const { data: message, error } = await supabase
      .from("messages")
      .insert({
        sender_username,
        receiver_username,
        content,
        message_type: message_type || "text",
        media_url,
        media_name,
        media_size,
        delivered_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating message:", error)
      return NextResponse.json({ error: "Failed to create message" }, { status: 500 })
    }

    return NextResponse.json({ message })
  } catch (error) {
    console.error("Error in POST /api/messages:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
