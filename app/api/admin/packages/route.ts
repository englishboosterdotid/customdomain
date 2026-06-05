import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requireAdmin } from "@/lib/shared/utils/admin"
import { getAllPackages, createPackage } from "@/lib/domains/assessment/service"
import { AppError } from "@/lib/shared/errors"

const CreatePackageSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
})

export async function GET() {
  try {
    await requireAdmin()
    const packages = await getAllPackages()
    return NextResponse.json({ packages })
  } catch (error) {
    if (error instanceof AppError)
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()
    const body = await request.json()
    const input = CreatePackageSchema.parse(body)
    const pkg = await createPackage(input)
    return NextResponse.json({ package: pkg }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError)
      return NextResponse.json({ error: "Validasi gagal", details: error.issues }, { status: 400 })
    if (error instanceof AppError)
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
