import { eq, and, asc } from "drizzle-orm"
import { db } from "@/lib/db"
import { examPackages, questions } from "@/lib/db/schema"

// ─── Exam Packages ────────────────────────────────────────────────────────────

export async function findAllPackages() {
  return db.select().from(examPackages).orderBy(asc(examPackages.createdAt))
}

export async function findPackageById(id: string) {
  const result = await db
    .select()
    .from(examPackages)
    .where(eq(examPackages.id, id))
    .limit(1)
  return result[0] ?? null
}

export async function findActivePackage() {
  const result = await db
    .select()
    .from(examPackages)
    .where(eq(examPackages.isActive, true))
    .orderBy(asc(examPackages.createdAt))
    .limit(1)
  return result[0] ?? null
}

export async function createPackage(data: {
  name: string
  description?: string
}) {
  const result = await db
    .insert(examPackages)
    .values({ name: data.name, description: data.description ?? null })
    .returning()
  return result[0]
}

export async function updatePackage(
  id: string,
  data: { name?: string; description?: string; isActive?: boolean }
) {
  const result = await db
    .update(examPackages)
    .set(data)
    .where(eq(examPackages.id, id))
    .returning()
  return result[0]
}

export async function deletePackage(id: string) {
  await db.delete(examPackages).where(eq(examPackages.id, id))
}

// ─── Questions ────────────────────────────────────────────────────────────────

export async function findQuestionsByPackage(examPackageId: string) {
  return db
    .select()
    .from(questions)
    .where(eq(questions.examPackageId, examPackageId))
    .orderBy(asc(questions.section), asc(questions.orderIndex))
}

export async function findQuestionById(id: string) {
  const result = await db
    .select()
    .from(questions)
    .where(eq(questions.id, id))
    .limit(1)
  return result[0] ?? null
}

export async function countQuestionsByPackage(examPackageId: string) {
  const rows = await db
    .select({ section: questions.section })
    .from(questions)
    .where(eq(questions.examPackageId, examPackageId))

  const counts = { listening: 0, structure: 0, reading: 0, total: rows.length }
  for (const r of rows) {
    if (r.section === "listening") counts.listening++
    else if (r.section === "structure") counts.structure++
    else if (r.section === "reading") counts.reading++
  }
  return counts
}

export async function createQuestion(data: {
  examPackageId: string
  section: "listening" | "structure" | "reading"
  type: "small_talk" | "conversation" | "long_conversation" | "fill_blank" | "identify_error" | "reading_comp"
  orderIndex: number
  audioKey?: string
  content: unknown
  options: unknown
  correctAnswer: string
}) {
  const result = await db
    .insert(questions)
    .values({
      examPackageId: data.examPackageId,
      section: data.section,
      type: data.type,
      orderIndex: data.orderIndex,
      audioKey: data.audioKey ?? null,
      content: data.content,
      options: data.options,
      correctAnswer: data.correctAnswer,
    })
    .returning()
  return result[0]
}

export async function updateQuestion(
  id: string,
  data: Partial<{
    orderIndex: number
    audioKey: string | null
    content: unknown
    options: unknown
    correctAnswer: string
  }>
) {
  const result = await db
    .update(questions)
    .set(data)
    .where(eq(questions.id, id))
    .returning()
  return result[0]
}

export async function deleteQuestion(id: string) {
  await db.delete(questions).where(eq(questions.id, id))
}
