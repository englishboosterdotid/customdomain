import {
  pgTable, uuid, text, timestamp, boolean, pgEnum
} from "drizzle-orm/pg-core"
import { users } from "./identity"

export const creatorTierEnum = pgEnum("creator_tier", ["free", "pro", "enterprise"])

export const creators = pgTable("creators", {
  id:           uuid("id").primaryKey().defaultRandom(),
  userId:       text("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  username:     text("username").notNull().unique(),
  tier:         creatorTierEnum("tier").notNull().default("free"),
  displayName:  text("display_name").notNull(),
  bio:          text("bio"),
  logoUrl:      text("logo_url"),
  coverUrl:     text("cover_url"),
  primaryColor: text("primary_color").default("#6366f1"),
  isActive:     boolean("is_active").notNull().default(true),
  createdAt:    timestamp("created_at").notNull().defaultNow(),
  updatedAt:    timestamp("updated_at").notNull().defaultNow(),
})

export const customDomains = pgTable("custom_domains", {
  id:            uuid("id").primaryKey().defaultRandom(),
  creatorId:     uuid("creator_id").notNull().references(() => creators.id, { onDelete: "cascade" }),
  domain:        text("domain").notNull().unique(),
  isWhiteLabel:  boolean("is_white_label").notNull().default(false),
  isVerified:    boolean("is_verified").notNull().default(false),
  sslProvisioned: boolean("ssl_provisioned").notNull().default(false),
  createdAt:     timestamp("created_at").notNull().defaultNow(),
  updatedAt:     timestamp("updated_at").notNull().defaultNow(),
})
