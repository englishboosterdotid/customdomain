import { eq, desc, sql } from "drizzle-orm"
import { db } from "@/lib/db"
import { orders, orderEvents, walletLedger, certificates, users, creators } from "@/lib/db/schema"

// ─── Orders ──────────────────────────────────────────────────────────────────

export async function findAllOrders(status?: string) {
  const query = db
    .select({
      order: orders,
    })
    .from(orders)
    .orderBy(desc(orders.createdAt))

  if (status) {
    return (await query).filter((r) => r.order.status === status).map((r) => r.order)
  }
  return (await query).map((r) => r.order)
}

export async function getOrderStats() {
  const result = await db
    .select({
      status: orders.status,
      count: sql<number>`COUNT(*)`,
      total: sql<number>`COALESCE(SUM(${orders.amountIDR}), 0)`,
      platformFee: sql<number>`COALESCE(SUM(${orders.platformFeeIDR}), 0)`,
    })
    .from(orders)
    .groupBy(orders.status)
  return result
}

// ─── Wallet / Revenue ─────────────────────────────────────────────────────────

export async function getPlatformRevenueSummary() {
  const result = await db
    .select({
      totalRevenue: sql<number>`COALESCE(SUM(${orders.amountIDR}), 0)`,
      totalFees: sql<number>`COALESCE(SUM(${orders.platformFeeIDR}), 0)`,
      totalCreatorEarnings: sql<number>`COALESCE(SUM(${orders.creatorEarningIDR}), 0)`,
      totalOrders: sql<number>`COUNT(*)`,
    })
    .from(orders)
    .where(eq(orders.status, "paid"))
  return result[0]
}

export async function getCreatorEarnings() {
  return db
    .select({
      creatorId: walletLedger.creatorId,
      username: creators.username,
      displayName: creators.displayName,
      totalEarning: sql<number>`COALESCE(SUM(${walletLedger.amount}), 0)`,
    })
    .from(walletLedger)
    .innerJoin(creators, eq(creators.id, walletLedger.creatorId))
    .groupBy(walletLedger.creatorId, creators.username, creators.displayName)
    .orderBy(desc(sql`SUM(${walletLedger.amount})`))
}

// ─── Certificates ─────────────────────────────────────────────────────────────

export async function findAllCertificates() {
  return db
    .select({
      certificate: certificates,
      userName: users.name,
      userEmail: users.email,
    })
    .from(certificates)
    .innerJoin(users, eq(users.id, certificates.userId))
    .orderBy(desc(certificates.issuedAt))
}

// ─── Users ───────────────────────────────────────────────────────────────────

export async function findAllUsers() {
  return db
    .select()
    .from(users)
    .orderBy(desc(users.createdAt))
}
