import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

// GET /api/users - Get all users
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get all users
    const { data: users, error } = await supabase
      .from("app_users")
      .select(`
        username,
        display_name,
        bio,
        profile_picture_url,
        posts_count,
        reels_count,
        followers_count,
        following_count,
        is_online,
        last_seen
      `)
      .order("username")

    if (error) {
      console.error("Error fetching users:", error)
      return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
    }

    return NextResponse.json({ users })
  } catch (error) {
    console.error("Error in GET /api/users:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
