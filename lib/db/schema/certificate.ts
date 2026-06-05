import {
  pgTable, uuid, text, timestamp, integer
} from "drizzle-orm/pg-core"
import { users } from "./identity"
import { attempts } from "./assessment"

// CRITICAL: immutable, one per scored attempt
export const certificates = pgTable("certificates", {
  id:           uuid("id").primaryKey().defaultRandom(),
  attemptId:    uuid("attempt_id").notNull().unique().references(() => attempts.id),
  userId:       text("user_id").notNull().references(() => users.id),
  code:         text("code").notNull().unique(), // public verify code (nanoid)
  holderName:   text("holder_name").notNull(),
  totalScore:   integer("total_score").notNull(),
  listeningScore: integer("listening_score").notNull(),
  structureScore: integer("structure_score").notNull(),
  readingScore:   integer("reading_score").notNull(),
  issuedAt:     timestamp("issued_at").notNull().defaultNow(),
  pdfKey:       text("pdf_key"), // R2 key, filled after generation
  // NOTE: no updatedAt — certificates are immutable
})
