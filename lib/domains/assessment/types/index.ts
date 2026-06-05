export type Section = "listening" | "structure" | "reading"
export type QuestionType =
  | "small_talk"
  | "conversation"
  | "long_conversation"
  | "fill_blank"
  | "identify_error"
  | "reading_comp"

export interface QuestionOption {
  key: "A" | "B" | "C" | "D"
  text: string
}

// Content berbeda per section
export interface ListeningContent {
  transcript?: string // opsional, untuk admin review
  question: string
}

export interface StructureFillBlankContent {
  sentence: string // kalimat dengan "___" sebagai blank
  question?: string
}

export interface StructureIdentifyContent {
  sentence: string // kalimat dengan bagian yang diunderline
  underlinedParts: string[] // A, B, C, D — bagian yang salah
}

export interface ReadingContent {
  passage: string // teks bacaan (bisa panjang)
  question: string
}

export type QuestionContent =
  | ListeningContent
  | StructureFillBlankContent
  | StructureIdentifyContent
  | ReadingContent

export interface Question {
  id: string
  examPackageId: string
  section: Section
  type: QuestionType
  orderIndex: number
  audioKey: string | null
  content: QuestionContent
  options: QuestionOption[]
  correctAnswer: string
  createdAt: Date
}

export interface ExamPackage {
  id: string
  name: string
  description: string | null
  version: number
  isActive: boolean
  createdAt: Date
}

export interface PackageWithCounts extends ExamPackage {
  counts: {
    listening: number
    structure: number
    reading: number
    total: number
  }
}

// TOEFL section limits
export const SECTION_LIMITS = {
  listening: 50,
  structure: 40,
  reading: 50,
} as const

export const SECTION_QUESTION_TYPES: Record<Section, QuestionType[]> = {
  listening: ["small_talk", "conversation", "long_conversation"],
  structure: ["fill_blank", "identify_error"],
  reading: ["reading_comp"],
}
