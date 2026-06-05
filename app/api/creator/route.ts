import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requireSession } from "@/lib/auth/session"
import { registerCreator } from "@/lib/domains/microsite/service"
import { AppError } from "@/lib/shared/errors"

const RegisterCreatorSchema = z.object({
  username: z.string().min(3).max(30),
  displayName: z.string().min(1).max(100),
})

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession()
    const body = await request.json()
    const input = RegisterCreatorSchema.parse(body)

    const creator = await registerCreator({
      userId: session.id,
      username: input.username,
      displayName: input.displayName,
    })

    return NextResponse.json({ creator }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validasi gagal", details: error.errors },
        { status: 400 }
      )
    }
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      )
    }
    console.error("[POST /api/creator]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
