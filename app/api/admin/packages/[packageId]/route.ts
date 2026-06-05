import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requireAdmin } from "@/lib/shared/utils/admin"
import { getPackageById, updatePackage, deletePackage } from "@/lib/domains/assessment/service"
import { AppError } from "@/lib/shared/errors"

const UpdatePackageSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  isActive: z.boolean().optional(),
})

interface Params { params: Promise<{ packageId: string }> }

export async function GET(_: NextRequest, { params }: Params) {
  try {
    await requireAdmin()
    const { packageId } = await params
    const pkg = await getPackageById(packageId)
    return NextResponse.json({ package: pkg })
  } catch (error) {
    if (error instanceof AppError)
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    await requireAdmin()
    const { packageId } = await params
    const body = await request.json()
    const input = UpdatePackageSchema.parse(body)
    const pkg = await updatePackage(packageId, input)
    return NextResponse.json({ package: pkg })
  } catch (error) {
    if (error instanceof z.ZodError)
      return NextResponse.json({ error: "Validasi gagal", details: error.issues }, { status: 400 })
    if (error instanceof AppError)
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(_: NextRequest, { params }: Params) {
  try {
    await requireAdmin()
    const { packageId } = await params
    await deletePackage(packageId)
    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof AppError)
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
