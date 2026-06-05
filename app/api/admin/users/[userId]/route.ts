import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requireAdmin } from "@/lib/shared/utils/admin"
import { assignRole } from "@/lib/domains/identity/repository"
import { AppError } from "@/lib/shared/errors"

const AssignRoleSchema = z.object({
  role: z.enum(["user", "creator", "admin"]),
})

interface Params { params: Promise<{ userId: string }> }

export async function POST(request: NextRequest, { params }: Params) {
  try {
    await requireAdmin()
    const { userId } = await params
    const body = await request.json()
    const { role } = AssignRoleSchema.parse(body)
    await assignRole(userId, role)
    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof z.ZodError)
      return NextResponse.json({ error: "Validasi gagal", details: error.issues }, { status: 400 })
    if (error instanceof AppError)
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
