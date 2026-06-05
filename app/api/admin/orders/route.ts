import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/shared/utils/admin"
import { findAllOrders, getOrderStats } from "@/lib/domains/commerce/repository/admin"
import { AppError } from "@/lib/shared/errors"

export async function GET(request: NextRequest) {
  try {
    await requireAdmin()
    const status = request.nextUrl.searchParams.get("status") ?? undefined
    const [orders, stats] = await Promise.all([
      findAllOrders(status),
      getOrderStats(),
    ])
    return NextResponse.json({ orders, stats })
  } catch (error) {
    if (error instanceof AppError)
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
