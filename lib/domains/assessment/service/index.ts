import { NotFoundError, InvariantError } from "@/lib/shared/errors"
import * as repo from "../repository"
import { SECTION_LIMITS, SECTION_QUESTION_TYPES } from "../types"
import type { Section, QuestionType, QuestionOption, QuestionContent, PackageWithCounts } from "../types"

// ─── Packages ─────────────────────────────────────────────────────────────────

export async function getAllPackages(): Promise<PackageWithCounts[]> {
  const packages = await repo.findAllPackages()
  return Promise.all(
    packages.map(async (pkg) => ({
      ...pkg,
      counts: await repo.countQuestionsByPackage(pkg.id),
    }))
  )
}

export async function getPackageById(id: string): Promise<PackageWithCounts> {
  const pkg = await repo.findPackageById(id)
  if (!pkg) throw new NotFoundError("Exam package")
  const counts = await repo.countQuestionsByPackage(id)
  return { ...pkg, counts }
}

export async function createPackage(data: { name: string; description?: string }) {
  if (!data.name.trim()) throw new InvariantError("Nama package wajib diisi")
  return repo.createPackage(data)
}

export async function updatePackage(
  id: string,
  data: { name?: string; description?: string; isActive?: boolean }
) {
  const pkg = await repo.findPackageById(id)
  if (!pkg) throw new NotFoundError("Exam package")

  // Jika mengaktifkan package ini, validasi jumlah soal dulu
  if (data.isActive === true) {
    const counts = await repo.countQuestionsByPackage(id)
    const errors: string[] = []
    if (counts.listening < SECTION_LIMITS.listening)
      errors.push(`Listening kurang: ${counts.listening}/${SECTION_LIMITS.listening}`)
    if (counts.structure < SECTION_LIMITS.structure)
      errors.push(`Structure kurang: ${counts.structure}/${SECTION_LIMITS.structure}`)
    if (counts.reading < SECTION_LIMITS.reading)
      errors.push(`Reading kurang: ${counts.reading}/${SECTION_LIMITS.reading}`)
    if (errors.length > 0)
      throw new InvariantError(`Package belum lengkap:\n${errors.join("\n")}`)
  }

  return repo.updatePackage(id, data)
}

export async function deletePackage(id: string) {
  const pkg = await repo.findPackageById(id)
  if (!pkg) throw new NotFoundError("Exam package")
  if (pkg.isActive) throw new InvariantError("Nonaktifkan package sebelum menghapus")
  return repo.deletePackage(id)
}

// ─── Questions ────────────────────────────────────────────────────────────────

export async function getQuestionsByPackage(packageId: string) {
  const pkg = await repo.findPackageById(packageId)
  if (!pkg) throw new NotFoundError("Exam package")
  return repo.findQuestionsByPackage(packageId)
}

export async function createQuestion(data: {
  examPackageId: string
  section: Section
  type: QuestionType
  audioKey?: string
  content: QuestionContent
  options: QuestionOption[]
  correctAnswer: string
}) {
  // Validasi type sesuai section
  const validTypes = SECTION_QUESTION_TYPES[data.section]
  if (!validTypes.includes(data.type)) {
    throw new InvariantError(
      `Type '${data.type}' tidak valid untuk section '${data.section}'`
    )
  }

  // Validasi correctAnswer ada di options
  const validKeys = data.options.map((o) => o.key)
  if (!validKeys.includes(data.correctAnswer as "A" | "B" | "C" | "D")) {
    throw new InvariantError("correctAnswer harus salah satu dari A, B, C, atau D")
  }

  // Cek limit per section
  const counts = await repo.countQuestionsByPackage(data.examPackageId)
  const currentCount = counts[data.section]
  const limit = SECTION_LIMITS[data.section]
  if (currentCount >= limit) {
    throw new InvariantError(
      `Section ${data.section} sudah penuh (${limit} soal)`
    )
  }

  // Auto-assign orderIndex
  const orderIndex = currentCount + 1

  return repo.createQuestion({ ...data, orderIndex })
}

export async function updateQuestion(
  id: string,
  data: Partial<{
    audioKey: string | null
    content: QuestionContent
    options: QuestionOption[]
    correctAnswer: string
  }>
) {
  const question = await repo.findQuestionById(id)
  if (!question) throw new NotFoundError("Question")
  return repo.updateQuestion(id, data)
}

export async function deleteQuestion(id: string) {
  const question = await repo.findQuestionById(id)
  if (!question) throw new NotFoundError("Question")
  return repo.deleteQuestion(id)
}
