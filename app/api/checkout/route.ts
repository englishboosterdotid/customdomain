import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getSession } from "@/lib/auth/session"
import { initiateCheckout } from "@/lib/domains/commerce/service"
import { AppError } from "@/lib/shared/errors"

const CheckoutSchema = z.object({
  offeringId: z.string().uuid(),
  buyerName: z.string().min(1).max(100),
  buyerEmail: z.string().email(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const input = CheckoutSchema.parse(body)

    // Session opsional — guest checkout diizinkan
    const session = await getSession()

    const { order, snap } = await initiateCheckout({
      offeringId: input.offeringId,
      buyerName: input.buyerName,
      buyerEmail: input.buyerEmail,
      buyerUserId: session?.id,
    })

    return NextResponse.json({
      orderId: order.id,
      snapToken: snap.token,
      redirectUrl: snap.redirectUrl,
    })
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
    console.error("[POST /api/checkout]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
