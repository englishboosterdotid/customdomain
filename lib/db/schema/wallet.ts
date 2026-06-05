import {
  pgTable, uuid, text, timestamp, integer, pgEnum
} from "drizzle-orm/pg-core"
import { creators } from "./microsite"
import { orders } from "./commerce"

export const walletTxTypeEnum = pgEnum("wallet_tx_type", [
  "earning",       // order paid → creator earns
  "payout",        // creator withdraw
  "payout_failed", // payout failed, reverse
  "fee_deduct",    // platform fee
  "refund_deduct"  // refund → deduct from creator
])

// CRITICAL: never store mutable balance. balance = SUM of ledger.
export const walletLedger = pgTable("wallet_ledger", {
  id:        uuid("id").primaryKey().defaultRandom(),
  creatorId: uuid("creator_id").notNull().references(() => creators.id),
  type:      walletTxTypeEnum("type").notNull(),
  amount:    integer("amount").notNull(), // IDR in cents, positive = credit, negative = debit
  orderId:   uuid("order_id").references(() => orders.id),
  note:      text("note"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

export const payouts = pgTable("payouts", {
  id:          uuid("id").primaryKey().defaultRandom(),
  creatorId:   uuid("creator_id").notNull().references(() => creators.id),
  amountIDR:   integer("amount_idr").notNull(),
  bankCode:    text("bank_code").notNull(),
  accountNo:   text("account_no").notNull(),
  accountName: text("account_name").notNull(),
  status:      text("status").notNull().default("pending"),
  processedAt: timestamp("processed_at"),
  createdAt:   timestamp("created_at").notNull().defaultNow(),
})
