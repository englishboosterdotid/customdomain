import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/shared/utils/admin"
import { getPlatformRevenueSummary, getCreatorEarnings } from "@/lib/domains/commerce/repository/admin"
import { AppError } from "@/lib/shared/errors"

export async function GET() {
  try {
    await requireAdmin()
    const [summary, creatorEarnings] = await Promise.all([
      getPlatformRevenueSummary(),
      getCreatorEarnings(),
    ])
    return NextResponse.json({ summary, creatorEarnings })
  } catch (error) {
    if (error instanceof AppError)
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
