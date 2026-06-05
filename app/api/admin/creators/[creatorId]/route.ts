import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requireAdmin } from "@/lib/shared/utils/admin"
import { setCreatorTier, setCreatorActive } from "@/lib/domains/microsite/repository/admin"
import { AppError } from "@/lib/shared/errors"

const UpdateCreatorSchema = z.object({
  tier: z.enum(["free", "pro", "enterprise"]).optional(),
  isActive: z.boolean().optional(),
})

interface Params { params: Promise<{ creatorId: string }> }

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    await requireAdmin()
    const { creatorId } = await params
    const body = await request.json()
    const input = UpdateCreatorSchema.parse(body)

    let result
    if (input.tier !== undefined) result = await setCreatorTier(creatorId, input.tier)
    if (input.isActive !== undefined) result = await setCreatorActive(creatorId, input.isActive)

    return NextResponse.json({ creator: result })
  } catch (error) {
    if (error instanceof z.ZodError)
      return NextResponse.json({ error: "Validasi gagal", details: error.issues }, { status: 400 })
    if (error instanceof AppError)
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
