import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/shared/utils/admin"
import { findAllCertificates } from "@/lib/domains/commerce/repository/admin"
import { AppError } from "@/lib/shared/errors"

export async function GET() {
  try {
    await requireAdmin()
    const certificates = await findAllCertificates()
    return NextResponse.json({ certificates })
  } catch (error) {
    if (error instanceof AppError)
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
