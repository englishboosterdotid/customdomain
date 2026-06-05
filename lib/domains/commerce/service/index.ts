import { nanoid } from "nanoid"
import { NotFoundError, InvariantError } from "@/lib/shared/errors"
import { calculatePlatformFee } from "@/lib/shared/utils"
import { createSnapTransaction } from "@/lib/payment/midtrans"
import { findCreatorById } from "@/lib/domains/microsite/repository"
import * as repo from "../repository"
import type {
  Offering,
  Order,
  CreateOrderInput,
  CreateOfferingInput,
  MidtransChargeResult,
} from "../types"

// ─── Offerings ───────────────────────────────────────────────────────────────

export async function createOffering(
  input: CreateOfferingInput
): Promise<Offering> {
  if (input.priceIDR < 100_00) {
    // minimum Rp 100
    throw new InvariantError("Harga minimum adalah Rp 100")
  }
  return repo.createOffering(input)
}

export async function getOfferingsByCreator(creatorId: string): Promise<Offering[]> {
  return repo.findOfferingsByCreator(creatorId)
}

export async function getOfferingById(id: string): Promise<Offering> {
  const offering = await repo.findOfferingById(id)
  if (!offering) throw new NotFoundError("Offering")
  return offering
}

// ─── Checkout ────────────────────────────────────────────────────────────────

/**
 * Buat order baru dan inisiasi Midtrans Snap transaction.
 * Idempotent — jika order dengan key yang sama sudah ada dan masih pending,
 * return order yang sudah ada.
 */
export async function initiateCheckout(
  input: CreateOrderInput
): Promise<{ order: Order; snap: MidtransChargeResult }> {
  const offering = await repo.findOfferingById(input.offeringId)
  if (!offering) throw new NotFoundError("Offering")
  if (!offering.isActive) throw new InvariantError("Offering tidak aktif")

  const creator = await findCreatorById(offering.creatorId)
  if (!creator) throw new NotFoundError("Creator")

  // Idempotency key berbasis offering + buyer email + tanggal
  // Sehingga buyer yang sama tidak bisa buat 2 order aktif untuk offering yang sama di hari yang sama
  const today = new Date().toISOString().slice(0, 10)
  const idempotencyKey = `${input.offeringId}:${input.buyerEmail}:${today}`

  // Cek existing order
  const existing = await repo.findOrderByIdempotencyKey(idempotencyKey)
  if (existing && existing.status === "pending") {
    // Re-create Snap token untuk order yang sudah ada
    const snap = await createSnapTransaction({
      orderId: existing.midtransOrderId!,
      amountIDR: existing.amountIDR,
      buyerName: existing.buyerName,
      buyerEmail: existing.buyerEmail,
      itemName: offering.name,
    })
    return { order: existing, snap }
  }

  // Hitung fee berdasarkan tier creator
  const { platformFee, creatorEarning } = calculatePlatformFee(
    offering.priceIDR,
    creator.tier
  )

  // Buat Midtrans order ID — harus unik, tidak boleh pakai UUID langsung
  // karena Midtrans ada limit karakter
  const midtransOrderId = `TFY-${nanoid(12).toUpperCase()}`

  const expiredAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 jam

  // Buat order di DB dulu
  const order = await repo.createOrder({
    offeringId: input.offeringId,
    creatorId: offering.creatorId,
    buyerEmail: input.buyerEmail,
    buyerName: input.buyerName,
    buyerUserId: input.buyerUserId ?? null,
    amountIDR: offering.priceIDR,
    platformFeeIDR: platformFee,
    creatorEarningIDR: creatorEarning,
    idempotencyKey,
    midtransOrderId,
    expiredAt,
  })

  await repo.appendOrderEvent(order.id, "order.created", {
    offeringId: input.offeringId,
    buyerEmail: input.buyerEmail,
  })

  // Inisiasi Snap transaction
  const snap = await createSnapTransaction({
    orderId: midtransOrderId,
    amountIDR: offering.priceIDR,
    buyerName: input.buyerName,
    buyerEmail: input.buyerEmail,
    itemName: offering.name,
    expiry: { duration: 24, unit: "hour" },
  })

  return { order, snap }
}

// ─── Order queries ────────────────────────────────────────────────────────────

export async function getOrderById(id: string): Promise<Order> {
  const order = await repo.findOrderById(id)
  if (!order) throw new NotFoundError("Order")
  return order
}
