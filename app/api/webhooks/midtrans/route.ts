import { NextRequest, NextResponse } from "next/server"
import { verifyWebhookSignature } from "@/lib/payment/midtrans"
import * as orderRepo from "@/lib/domains/commerce/repository"
import { grantCreditsForOrder } from "@/lib/domains/credits/service"
import { recordEarning } from "@/lib/domains/wallet/service"

/**
 * Midtrans webhook handler.
 *
 * CRITICAL INVARIANTS yang dijaga di sini:
 * 1. Signature diverifikasi sebelum apapun diproses
 * 2. Order hanya diproses SEKALI (idempotency via status check di repo)
 * 3. Credit dan wallet di-update SETELAH order marked paid — tidak sebelumnya
 * 4. Setiap event di-log ke order_events untuk audit trail
 */
export async function POST(request: NextRequest) {
  let body: Record<string, string>

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  // ── Step 1: Verifikasi signature ──────────────────────────────────────────
  const isValid = await verifyWebhookSignature({
    order_id: body.order_id,
    status_code: body.status_code,
    gross_amount: body.gross_amount,
    signature_key: body.signature_key,
  })

  if (!isValid) {
    console.warn("[webhook/midtrans] Invalid signature", { order_id: body.order_id })
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
  }

  const midtransOrderId: string = body.order_id
  const transactionStatus: string = body.transaction_status
  const fraudStatus: string = body.fraud_status ?? "accept"
  const paymentType: string = body.payment_type ?? "unknown"

  // ── Step 2: Temukan order di DB ────────────────────────────────────────────
  const order = await orderRepo.findOrderByMidtransId(midtransOrderId)

  if (!order) {
    // Midtrans kadang kirim notifikasi untuk transaksi test — abaikan saja
    console.warn("[webhook/midtrans] Order not found", { midtransOrderId })
    return NextResponse.json({ ok: true })
  }

  // Log semua incoming webhook untuk audit trail
  await orderRepo.appendOrderEvent(order.id, `midtrans.${transactionStatus}`, {
    transactionStatus,
    fraudStatus,
    paymentType,
    raw: body,
  })

  // ── Step 3: Proses berdasarkan status ─────────────────────────────────────
  const isPaid =
    (transactionStatus === "capture" && fraudStatus === "accept") ||
    transactionStatus === "settlement"

  const isFailed =
    transactionStatus === "cancel" ||
    transactionStatus === "deny" ||
    transactionStatus === "expire"

  if (isPaid) {
    await handlePaymentSuccess(order.id, order.creatorId, paymentType)
  } else if (isFailed) {
    await handlePaymentFailed(order.id, transactionStatus)
  }
  // Status "pending" diabaikan — tunggu settlement/capture

  return NextResponse.json({ ok: true })
}

async function handlePaymentSuccess(
  orderId: string,
  creatorId: string,
  paymentType: string
): Promise<void> {
  // markOrderPaid sudah ada guard internal — throw jika order bukan pending
  // Ini mencegah double-processing jika Midtrans kirim notifikasi duplikat
  let order
  try {
    order = await orderRepo.markOrderPaid(orderId, paymentType)
  } catch (err) {
    // Order sudah diproses sebelumnya — ini normal, abaikan
    console.info("[webhook/midtrans] Order already processed", { orderId })
    return
  }

  await orderRepo.appendOrderEvent(orderId, "order.paid", { paymentType })

  // Grant 1 credit ke buyer
  // buyerUserId bisa null jika guest checkout — untuk guest, credit di-tie ke email
  // Untuk sekarang kita hanya grant jika ada userId
  if (order.buyerUserId) {
    await grantCreditsForOrder(order.buyerUserId, 1, orderId)
    await orderRepo.appendOrderEvent(orderId, "credit.granted", {
      userId: order.buyerUserId,
      amount: 1,
    })
  }

  // Credit earning ke wallet creator
  await recordEarning(creatorId, order.creatorEarningIDR, orderId)
  await orderRepo.appendOrderEvent(orderId, "wallet.credited", {
    creatorId,
    amount: order.creatorEarningIDR,
  })
}

async function handlePaymentFailed(
  orderId: string,
  reason: string
): Promise<void> {
  try {
    await orderRepo.markOrderFailed(orderId)
    await orderRepo.appendOrderEvent(orderId, "order.failed", { reason })
  } catch {
    console.info("[webhook/midtrans] Order already processed (failed)", { orderId })
  }
}
