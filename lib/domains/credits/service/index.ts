import { InsufficientCreditsError, InvariantError } from "@/lib/shared/errors"
import * as repo from "../repository"

/**
 * Grant credit setelah order paid.
 * Dipanggil dari webhook handler, bukan dari route langsung.
 */
export async function grantCreditsForOrder(
  userId: string,
  amount: number,
  orderId: string
): Promise<void> {
  if (amount <= 0) throw new InvariantError("Credit amount harus positif")

  await repo.appendCreditEntry({
    userId,
    type: "purchase",
    amount,
    orderId,
    note: `Credit dari order ${orderId}`,
  })
}

/**
 * CRITICAL: Consume exactly 1 credit untuk 1 attempt.
 * Balance tidak boleh negatif setelah consume.
 */
export async function consumeOneCredit(
  userId: string,
  note?: string
): Promise<void> {
  const balance = await repo.getCreditBalance(userId)

  if (balance < 1) throw new InsufficientCreditsError()

  await repo.appendCreditEntry({
    userId,
    type: "consume",
    amount: -1,
    note: note ?? "Attempt TOEFL dimulai",
  })
}

export async function getCreditBalance(userId: string): Promise<number> {
  return repo.getCreditBalance(userId)
}

export async function getCreditHistory(userId: string) {
  return repo.getLedgerHistory(userId)
}
