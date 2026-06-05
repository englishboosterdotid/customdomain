import { eq, sql } from "drizzle-orm"
import { db } from "@/lib/db"
import { creditLedger } from "@/lib/db/schema"

export type CreditTxType = "purchase" | "consume" | "refund" | "admin_grant"

/**
 * CRITICAL: balance selalu di-derive dari ledger, tidak pernah disimpan.
 */
export async function getCreditBalance(userId: string): Promise<number> {
  const result = await db
    .select({ balance: sql<number>`COALESCE(SUM(${creditLedger.amount}), 0)` })
    .from(creditLedger)
    .where(eq(creditLedger.userId, userId))

  return Number(result[0]?.balance ?? 0)
}

export async function appendCreditEntry(data: {
  userId: string
  type: CreditTxType
  amount: number // positif = credit, negatif = debit
  orderId?: string
  note?: string
}): Promise<void> {
  await db.insert(creditLedger).values({
    userId: data.userId,
    type: data.type,
    amount: data.amount,
    orderId: data.orderId ?? null,
    note: data.note ?? null,
  })
}

export async function getLedgerHistory(userId: string) {
  return db
    .select()
    .from(creditLedger)
    .where(eq(creditLedger.userId, userId))
    .orderBy(creditLedger.createdAt)
}
