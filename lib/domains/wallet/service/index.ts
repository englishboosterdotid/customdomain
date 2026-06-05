import { InvariantError } from "@/lib/shared/errors"
import * as repo from "../repository"

/**
 * Credit earning ke wallet creator setelah order paid.
 * Dipanggil dari webhook handler.
 */
export async function recordEarning(
  creatorId: string,
  amountIDR: number,
  orderId: string
): Promise<void> {
  if (amountIDR <= 0) throw new InvariantError("Earning amount harus positif")

  await repo.appendWalletEntry({
    creatorId,
    type: "earning",
    amount: amountIDR,
    orderId,
    note: `Earning dari order ${orderId}`,
  })
}

export async function requestPayout(data: {
  creatorId: string
  amountIDR: number
  bankCode: string
  accountNo: string
  accountName: string
}) {
  const balance = await repo.getWalletBalance(data.creatorId)
  if (balance < data.amountIDR) {
    throw new InvariantError("Saldo wallet tidak mencukupi untuk payout")
  }

  // Deduct dulu dari ledger
  await repo.appendWalletEntry({
    creatorId: data.creatorId,
    type: "payout",
    amount: -data.amountIDR,
    note: "Payout request",
  })

  // Buat payout record
  return repo.createPayout(data)
}

export async function getWalletBalance(creatorId: string): Promise<number> {
  return repo.getWalletBalance(creatorId)
}

export async function getWalletHistory(creatorId: string) {
  return repo.getLedgerHistory(creatorId)
}
