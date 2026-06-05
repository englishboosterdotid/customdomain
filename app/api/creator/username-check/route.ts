import { NextRequest, NextResponse } from "next/server"
import { checkUsernameAvailability } from "@/lib/domains/microsite/service"

export async function GET(request: NextRequest) {
  const username = request.nextUrl.searchParams.get("username")

  if (!username) {
    return NextResponse.json({ error: "username required" }, { status: 400 })
  }

  const result = await checkUsernameAvailability(username)
  return NextResponse.json(result)
}
