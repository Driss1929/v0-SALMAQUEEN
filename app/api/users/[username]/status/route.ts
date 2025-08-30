import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

// GET /api/users/[username]/status - Get user status
export async function GET(request: NextRequest, { params }: { params: { username: string } }) {
  try {
    const { username } = params

    const supabase = await createClient()

    // Get user status
    const { data: user, error } = await supabase
      .from("app_users")
      .select("username, is_online, last_seen")
      .eq("username", username)
      .single()

    if (error) {
      console.error("Error fetching user status:", error)
      return NextResponse.json({ error: "Failed to fetch user status" }, { status: 500 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error("Error in GET /api/users/[username]/status:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT /api/users/[username]/status - Update user status
export async function PUT(request: NextRequest, { params }: { params: { username: string } }) {
  try {
    const { username } = params
    const body = await request.json()
    const { is_online, currentUser } = body

    if (currentUser !== username) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const supabase = await createClient()

    // Set the current user context for RLS
    await supabase.rpc("set_config", {
      parameter: "app.current_user",
      value: currentUser,
    })

    // Update user status
    const { data: user, error } = await supabase
      .from("app_users")
      .update({
        is_online,
        last_seen: new Date().toISOString(),
      })
      .eq("username", username)
      .select()
      .single()

    if (error) {
      console.error("Error updating user status:", error)
      return NextResponse.json({ error: "Failed to update user status" }, { status: 500 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error("Error in PUT /api/users/[username]/status:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
