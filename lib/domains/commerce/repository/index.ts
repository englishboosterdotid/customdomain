import { eq, and } from "drizzle-orm"
import { db } from "@/lib/db"
import {
  catalogProducts,
  offerings,
  orders,
  orderEvents,
} from "@/lib/db/schema"
import type { CatalogProduct, Offering, Order, CreateOfferingInput } from "../types"

// ─── Catalog ────────────────────────────────────────────────────────────────

export async function findActiveCatalogProducts(): Promise<CatalogProduct[]> {
  return db
    .select()
    .from(catalogProducts)
    .where(eq(catalogProducts.isActive, true)) as Promise<CatalogProduct[]>
}

export async function findCatalogProductById(id: string): Promise<CatalogProduct | null> {
  const result = await db
    .select()
    .from(catalogProducts)
    .where(eq(catalogProducts.id, id))
    .limit(1)
  return (result[0] as CatalogProduct) ?? null
}

// ─── Offerings ──────────────────────────────────────────────────────────────

export async function findOfferingById(id: string): Promise<Offering | null> {
  const result = await db
    .select()
    .from(offerings)
    .where(eq(offerings.id, id))
    .limit(1)
  return (result[0] as Offering) ?? null
}

export async function findOfferingsByCreator(creatorId: string): Promise<Offering[]> {
  return db
    .select()
    .from(offerings)
    .where(
      and(eq(offerings.creatorId, creatorId), eq(offerings.isActive, true))
    ) as Promise<Offering[]>
}

export async function createOffering(input: CreateOfferingInput): Promise<Offering> {
  const result = await db
    .insert(offerings)
    .values({
      creatorId: input.creatorId,
      catalogProductId: input.catalogProductId ?? null,
      name: input.name,
      description: input.description ?? null,
      priceIDR: input.priceIDR,
      bonusText: input.bonusText ?? null,
    })
    .returning()
  return result[0] as Offering
}

export async function updateOfferingStatus(
  id: string,
  isActive: boolean
): Promise<void> {
  await db
    .update(offerings)
    .set({ isActive, updatedAt: new Date() })
    .where(eq(offerings.id, id))
}

// ─── Orders ──────────────────────────────────────────────────────────────────

export async function findOrderById(id: string): Promise<Order | null> {
  const result = await db
    .select()
    .from(orders)
    .where(eq(orders.id, id))
    .limit(1)
  return (result[0] as Order) ?? null
}

export async function findOrderByIdempotencyKey(key: string): Promise<Order | null> {
  const result = await db
    .select()
    .from(orders)
    .where(eq(orders.idempotencyKey, key))
    .limit(1)
  return (result[0] as Order) ?? null
}

export async function findOrderByMidtransId(midtransOrderId: string): Promise<Order | null> {
  const result = await db
    .select()
    .from(orders)
    .where(eq(orders.midtransOrderId, midtransOrderId))
    .limit(1)
  return (result[0] as Order) ?? null
}

export async function createOrder(data: {
  offeringId: string
  creatorId: string
  buyerEmail: string
  buyerName: string
  buyerUserId: string | null
  amountIDR: number
  platformFeeIDR: number
  creatorEarningIDR: number
  idempotencyKey: string
  midtransOrderId: string
  expiredAt: Date
}): Promise<Order> {
  const result = await db
    .insert(orders)
    .values(data)
    .returning()
  return result[0] as Order
}

/**
 * CRITICAL: Order yang sudah paid tidak boleh diubah.
 * Hanya boleh update status dari pending → paid/failed/expired.
 */
export async function markOrderPaid(
  id: string,
  paymentType: string
): Promise<Order> {
  // Guard: hanya proses jika masih pending
  const order = await findOrderById(id)
  if (!order) throw new Error(`Order ${id} not found`)
  if (order.status !== "pending") {
    throw new Error(`Order ${id} already processed: ${order.status}`)
  }

  const result = await db
    .update(orders)
    .set({
      status: "paid",
      midtransPaymentType: paymentType,
      paidAt: new Date(),
    })
    .where(and(eq(orders.id, id), eq(orders.status, "pending")))
    .returning()

  if (!result[0]) throw new Error(`Order ${id} concurrent update conflict`)
  return result[0] as Order
}

export async function markOrderFailed(id: string): Promise<void> {
  await db
    .update(orders)
    .set({ status: "failed" })
    .where(and(eq(orders.id, id), eq(orders.status, "pending")))
}

export async function markOrderExpired(id: string): Promise<void> {
  await db
    .update(orders)
    .set({ status: "expired" })
    .where(and(eq(orders.id, id), eq(orders.status, "pending")))
}

// ─── Order Events (audit log) ────────────────────────────────────────────────

export async function appendOrderEvent(
  orderId: string,
  event: string,
  payload?: Record<string, unknown>
): Promise<void> {
  await db.insert(orderEvents).values({
    orderId,
    event,
    payload: payload ?? null,
  })
}
