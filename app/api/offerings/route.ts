import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requireSession, sessionHasRole } from "@/lib/auth/session"
import { getCreatorByUserId } from "@/lib/domains/microsite/service"
import { createOffering, getOfferingsByCreator } from "@/lib/domains/commerce/service"
import { AppError, ForbiddenError } from "@/lib/shared/errors"

const CreateOfferingSchema = z.object({
  catalogProductId: z.string().uuid().optional(),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  priceIDR: z.number().int().min(10000), // minimum Rp 100 (dalam cents)
  bonusText: z.string().max(500).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession()

    if (!sessionHasRole(session, "creator")) {
      throw new ForbiddenError("Hanya creator yang dapat membuat offering")
    }

    const creator = await getCreatorByUserId(session.id)
    if (!creator) throw new ForbiddenError("Creator profile tidak ditemukan")

    const body = await request.json()
    const input = CreateOfferingSchema.parse(body)

    const offering = await createOffering({
      creatorId: creator.id,
      ...input,
    })

    return NextResponse.json({ offering }, { status: 201 })
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
    console.error("[POST /api/offerings]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireSession()
    const creator = await getCreatorByUserId(session.id)
    if (!creator) throw new ForbiddenError("Creator profile tidak ditemukan")

    const offerings = await getOfferingsByCreator(creator.id)
    return NextResponse.json({ offerings })
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      )
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
