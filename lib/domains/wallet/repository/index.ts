import { eq, sql } from "drizzle-orm"
import { db } from "@/lib/db"
import { walletLedger, payouts } from "@/lib/db/schema"

export type WalletTxType =
  | "earning"
  | "payout"
  | "payout_failed"
  | "fee_deduct"
  | "refund_deduct"

/**
 * CRITICAL: balance selalu di-derive dari ledger, tidak pernah disimpan.
 */
export async function getWalletBalance(creatorId: string): Promise<number> {
  const result = await db
    .select({ balance: sql<number>`COALESCE(SUM(${walletLedger.amount}), 0)` })
    .from(walletLedger)
    .where(eq(walletLedger.creatorId, creatorId))

  return Number(result[0]?.balance ?? 0)
}

export async function appendWalletEntry(data: {
  creatorId: string
  type: WalletTxType
  amount: number // positif = credit, negatif = debit
  orderId?: string
  note?: string
}): Promise<void> {
  await db.insert(walletLedger).values({
    creatorId: data.creatorId,
    type: data.type,
    amount: data.amount,
    orderId: data.orderId ?? null,
    note: data.note ?? null,
  })
}

export async function getLedgerHistory(creatorId: string) {
  return db
    .select()
    .from(walletLedger)
    .where(eq(walletLedger.creatorId, creatorId))
    .orderBy(walletLedger.createdAt)
}

export async function createPayout(data: {
  creatorId: string
  amountIDR: number
  bankCode: string
  accountNo: string
  accountName: string
}) {
  const result = await db.insert(payouts).values(data).returning()
  return result[0]
}

export async function findPayoutsByCreator(creatorId: string) {
  return db
    .select()
    .from(payouts)
    .where(eq(payouts.creatorId, creatorId))
    .orderBy(payouts.createdAt)
}
