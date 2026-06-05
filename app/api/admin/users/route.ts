import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/shared/utils/admin"
import { findAllUsers } from "@/lib/domains/commerce/repository/admin"
import { AppError } from "@/lib/shared/errors"

export async function GET() {
  try {
    await requireAdmin()
    const users = await findAllUsers()
    return NextResponse.json({ users })
  } catch (error) {
    if (error instanceof AppError)
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
