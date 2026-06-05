import {
  pgTable, uuid, text, timestamp, integer, boolean, jsonb, pgEnum
} from "drizzle-orm/pg-core"
import { users } from "./identity"

export const sectionEnum = pgEnum("section", ["listening", "structure", "reading"])
export const questionTypeEnum = pgEnum("question_type", [
  "small_talk",       // listening
  "conversation",     // listening
  "long_conversation",// listening
  "fill_blank",       // structure
  "identify_error",   // structure
  "reading_comp"      // reading
])
export const attemptStatusEnum = pgEnum("attempt_status", [
  "in_progress",
  "submitted",
  "scored",
  "expired"
])

export const examPackages = pgTable("exam_packages", {
  id:          uuid("id").primaryKey().defaultRandom(),
  name:        text("name").notNull(),
  description: text("description"),
  version:     integer("version").notNull().default(1),
  isActive:    boolean("is_active").notNull().default(true),
  createdAt:   timestamp("created_at").notNull().defaultNow(),
})

export const questions = pgTable("questions", {
  id:            uuid("id").primaryKey().defaultRandom(),
  examPackageId: uuid("exam_package_id").notNull().references(() => examPackages.id),
  section:       sectionEnum("section").notNull(),
  type:          questionTypeEnum("type").notNull(),
  orderIndex:    integer("order_index").notNull(),
  // For listening: audio file key in R2
  audioKey:      text("audio_key"),
  // Question content as structured JSON
  content:       jsonb("content").notNull(),
  // Options as JSON array: [{key: "A", text: "..."}]
  options:       jsonb("options").notNull(),
  correctAnswer: text("correct_answer").notNull(),
  createdAt:     timestamp("created_at").notNull().defaultNow(),
})

// CRITICAL: snapshot is immutable once created
export const attempts = pgTable("attempts", {
  id:            uuid("id").primaryKey().defaultRandom(),
  userId:        text("user_id").notNull().references(() => users.id),
  examPackageId: uuid("exam_package_id").notNull().references(() => examPackages.id),
  status:        attemptStatusEnum("status").notNull().default("in_progress"),
  startedAt:     timestamp("started_at").notNull().defaultNow(),
  submittedAt:   timestamp("submitted_at"),
  expiredAt:     timestamp("expired_at").notNull(), // startedAt + 3 hours
  // Scores (filled after scoring)
  listeningScore:  integer("listening_score"),
  structureScore:  integer("structure_score"),
  readingScore:    integer("reading_score"),
  totalScore:      integer("total_score"),
  createdAt:       timestamp("created_at").notNull().defaultNow(),
})

// CRITICAL: immutable snapshot of exam state at attempt start
export const attemptSnapshots = pgTable("attempt_snapshots", {
  id:        uuid("id").primaryKey().defaultRandom(),
  attemptId: uuid("attempt_id").notNull().unique().references(() => attempts.id),
  // Full snapshot of questions at time of attempt (immutable)
  snapshot:  jsonb("snapshot").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  // NOTE: no updatedAt — snapshots never change
})

export const attemptAnswers = pgTable("attempt_answers", {
  id:          uuid("id").primaryKey().defaultRandom(),
  attemptId:   uuid("attempt_id").notNull().references(() => attempts.id),
  questionId:  uuid("question_id").notNull().references(() => questions.id),
  answer:      text("answer"), // null = unanswered
  isCorrect:   boolean("is_correct"),
  answeredAt:  timestamp("answered_at"),
  createdAt:   timestamp("created_at").notNull().defaultNow(),
})
