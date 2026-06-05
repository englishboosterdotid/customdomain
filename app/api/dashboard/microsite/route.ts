import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requireSession, sessionHasRole } from "@/lib/auth/session"
import { getCreatorByUserId, updateMicrosite } from "@/lib/domains/microsite/service"
import { AppError, ForbiddenError } from "@/lib/shared/errors"
import { UpdateMicrositeSchema } from "@/lib/shared/validators"

// GET /api/dashboard/microsite — ambil profil microsite creator
export async function GET() {
  try {
    const session = await requireSession()
    if (!sessionHasRole(session, "creator")) throw new ForbiddenError()

    const creator = await getCreatorByUserId(session.id)
    if (!creator) throw new ForbiddenError("Creator profile tidak ditemukan")

    return NextResponse.json({ creator })
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH /api/dashboard/microsite — update microsite settings
export async function PATCH(request: NextRequest) {
  try {
    const session = await requireSession()
    if (!sessionHasRole(session, "creator")) throw new ForbiddenError()

    const creator = await getCreatorByUserId(session.id)
    if (!creator) throw new ForbiddenError("Creator profile tidak ditemukan")

    const body = await request.json()
    const input = UpdateMicrositeSchema.parse(body)

    const updated = await updateMicrosite(creator.id, session.id, input)
    return NextResponse.json({ creator: updated })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validasi gagal", details: error.issues }, { status: 400 })
    }
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
