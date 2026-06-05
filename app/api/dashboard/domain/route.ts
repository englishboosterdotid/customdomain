import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requireSession, sessionHasRole } from "@/lib/auth/session"
import { getCreatorByUserId } from "@/lib/domains/microsite/service"
import {
  addCustomDomain,
  getCreatorDomains,
  removeCustomDomain,
  toggleWhiteLabel,
  verifyDomain,
} from "@/lib/domains/microsite/service/domain"
import { AppError, ForbiddenError } from "@/lib/shared/errors"

const AddDomainSchema = z.object({
  domain: z.string().min(4).max(253),
  isWhiteLabel: z.boolean().default(false),
})

const PatchDomainSchema = z.object({
  domainId: z.string().uuid(),
  action: z.enum(["toggle_whitelabel", "verify"]),
  isWhiteLabel: z.boolean().optional(),
})

// GET — list semua custom domain milik creator
export async function GET() {
  try {
    const session = await requireSession()
    if (!sessionHasRole(session, "creator")) throw new ForbiddenError()

    const creator = await getCreatorByUserId(session.id)
    if (!creator) throw new ForbiddenError("Creator profile tidak ditemukan")

    const domains = await getCreatorDomains(creator.id)
    return NextResponse.json({ domains })
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST — tambah custom domain baru
export async function POST(request: NextRequest) {
  try {
    const session = await requireSession()
    if (!sessionHasRole(session, "creator")) throw new ForbiddenError()

    const creator = await getCreatorByUserId(session.id)
    if (!creator) throw new ForbiddenError("Creator profile tidak ditemukan")

    const body = await request.json()
    const input = AddDomainSchema.parse(body)

    const domain = await addCustomDomain(creator.id, input.domain, input.isWhiteLabel)
    return NextResponse.json({ domain }, { status: 201 })
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

// PATCH — toggle white-label atau verifikasi domain
export async function PATCH(request: NextRequest) {
  try {
    const session = await requireSession()
    if (!sessionHasRole(session, "creator")) throw new ForbiddenError()

    const creator = await getCreatorByUserId(session.id)
    if (!creator) throw new ForbiddenError("Creator profile tidak ditemukan")

    const body = await request.json()
    const input = PatchDomainSchema.parse(body)

    if (input.action === "toggle_whitelabel") {
      const domain = await toggleWhiteLabel(
        input.domainId,
        creator.id,
        input.isWhiteLabel ?? false
      )
      return NextResponse.json({ domain })
    }

    if (input.action === "verify") {
      const result = await verifyDomain(input.domainId, creator.id)
      return NextResponse.json(result)
    }

    return NextResponse.json({ error: "Action tidak dikenal" }, { status: 400 })
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

// DELETE — hapus custom domain
export async function DELETE(request: NextRequest) {
  try {
    const session = await requireSession()
    if (!sessionHasRole(session, "creator")) throw new ForbiddenError()

    const creator = await getCreatorByUserId(session.id)
    if (!creator) throw new ForbiddenError("Creator profile tidak ditemukan")

    const { domainId } = await request.json()
    if (!domainId) return NextResponse.json({ error: "domainId required" }, { status: 400 })

    await removeCustomDomain(domainId, creator.id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
