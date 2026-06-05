import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/shared/utils/admin"
import { findAllCreators } from "@/lib/domains/microsite/repository/admin"
import { AppError } from "@/lib/shared/errors"

export async function GET() {
  try {
    await requireAdmin()
    const creators = await findAllCreators()
    return NextResponse.json({ creators })
  } catch (error) {
    if (error instanceof AppError)
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
