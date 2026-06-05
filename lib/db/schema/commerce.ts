import {
  pgTable, uuid, text, timestamp, integer, boolean, pgEnum, jsonb
} from "drizzle-orm/pg-core"
import { creators } from "./microsite"
import { users } from "./identity"

export const productTypeEnum = pgEnum("product_type", [
  "toefl_simulation",
  "digital_product",
  "resell"
])

export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "paid",
  "failed",
  "expired",
  "refunded"
])

// Platform owns catalog products
export const catalogProducts = pgTable("catalog_products", {
  id:          uuid("id").primaryKey().defaultRandom(),
  type:        productTypeEnum("type").notNull(),
  name:        text("name").notNull(),
  description: text("description"),
  isActive:    boolean("is_active").notNull().default(true),
  metadata:    jsonb("metadata"),
  createdAt:   timestamp("created_at").notNull().defaultNow(),
  updatedAt:   timestamp("updated_at").notNull().defaultNow(),
})

// Creator owns offerings (their pricing + bonuses on catalog products)
export const offerings = pgTable("offerings", {
  id:              uuid("id").primaryKey().defaultRandom(),
  creatorId:       uuid("creator_id").notNull().references(() => creators.id),
  catalogProductId: uuid("catalog_product_id").references(() => catalogProducts.id),
  name:            text("name").notNull(),
  description:     text("description"),
  priceIDR:        integer("price_idr").notNull(), // stored in cents (IDR x 100)
  isActive:        boolean("is_active").notNull().default(true),
  bonusText:       text("bonus_text"),
  metadata:        jsonb("metadata"),
  createdAt:       timestamp("created_at").notNull().defaultNow(),
  updatedAt:       timestamp("updated_at").notNull().defaultNow(),
})

// Immutable once paid
export const orders = pgTable("orders", {
  id:              uuid("id").primaryKey().defaultRandom(),
  offeringId:      uuid("offering_id").notNull().references(() => offerings.id),
  creatorId:       uuid("creator_id").notNull().references(() => creators.id),
  buyerEmail:      text("buyer_email").notNull(),
  buyerName:       text("buyer_name").notNull(),
  buyerUserId:     text("buyer_user_id").references(() => users.id), // null = guest
  amountIDR:       integer("amount_idr").notNull(),
  platformFeeIDR:  integer("platform_fee_idr").notNull(),
  creatorEarningIDR: integer("creator_earning_idr").notNull(),
  status:          orderStatusEnum("status").notNull().default("pending"),
  idempotencyKey:  text("idempotency_key").notNull().unique(),
  midtransOrderId: text("midtrans_order_id").unique(),
  midtransPaymentType: text("midtrans_payment_type"),
  paidAt:          timestamp("paid_at"),
  expiredAt:       timestamp("expired_at"),
  createdAt:       timestamp("created_at").notNull().defaultNow(),
  // NOTE: no updatedAt — paid orders are append-only via status events
})

export const orderEvents = pgTable("order_events", {
  id:        uuid("id").primaryKey().defaultRandom(),
  orderId:   uuid("order_id").notNull().references(() => orders.id),
  event:     text("event").notNull(), // "payment.success", "payment.failed", etc
  payload:   jsonb("payload"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})
