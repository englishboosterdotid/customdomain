import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requireAdmin } from "@/lib/shared/utils/admin"
import { getQuestionsByPackage, createQuestion } from "@/lib/domains/assessment/service"
import { AppError } from "@/lib/shared/errors"

const QuestionOptionSchema = z.object({
  key: z.enum(["A", "B", "C", "D"]),
  text: z.string().min(1),
})

const CreateQuestionSchema = z.object({
  section: z.enum(["listening", "structure", "reading"]),
  type: z.enum([
    "small_talk", "conversation", "long_conversation",
    "fill_blank", "identify_error", "reading_comp",
  ]),
  audioKey: z.string().optional(),
  content: z.record(z.unknown()),
  options: z.array(QuestionOptionSchema).min(2).max(4),
  correctAnswer: z.enum(["A", "B", "C", "D"]),
})

interface Params { params: Promise<{ packageId: string }> }

export async function GET(_: NextRequest, { params }: Params) {
  try {
    await requireAdmin()
    const { packageId } = await params
    const questions = await getQuestionsByPackage(packageId)
    return NextResponse.json({ questions })
  } catch (error) {
    if (error instanceof AppError)
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    await requireAdmin()
    const { packageId } = await params
    const body = await request.json()
    const input = CreateQuestionSchema.parse(body)
    const question = await createQuestion({
      examPackageId: packageId,
      ...input,
    } as Parameters<typeof createQuestion>[0])
    return NextResponse.json({ question }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError)
      return NextResponse.json({ error: "Validasi gagal", details: error.errors }, { status: 400 })
    if (error instanceof AppError)
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
