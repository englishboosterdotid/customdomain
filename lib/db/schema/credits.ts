import {
  pgTable, uuid, text, timestamp, integer, pgEnum
} from "drizzle-orm/pg-core"
import { users } from "./identity"
import { orders } from "./commerce"

export const creditTxTypeEnum = pgEnum("credit_tx_type", [
  "purchase",   // order paid → credit granted
  "consume",    // attempt started → 1 credit consumed
  "refund",     // order refunded
  "admin_grant" // manual grant by admin
])

// CRITICAL: never store mutable balance. balance = SUM of ledger.
export const creditLedger = pgTable("credit_ledger", {
  id:        uuid("id").primaryKey().defaultRandom(),
  userId:    text("user_id").notNull().references(() => users.id),
  type:      creditTxTypeEnum("type").notNull(),
  amount:    integer("amount").notNull(), // positive = credit, negative = debit
  orderId:   uuid("order_id").references(() => orders.id),
  note:      text("note"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})
