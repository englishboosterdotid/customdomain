import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requireAdmin } from "@/lib/shared/utils/admin"
import { updateQuestion, deleteQuestion } from "@/lib/domains/assessment/service"
import { AppError } from "@/lib/shared/errors"

const UpdateQuestionSchema = z.object({
  audioKey: z.string().nullable().optional(),
  content: z.unknown().optional(),
  options: z.array(z.object({
    key: z.enum(["A", "B", "C", "D"]),
    text: z.string().min(1),
  })).optional(),
  correctAnswer: z.enum(["A", "B", "C", "D"]).optional(),
})

interface Params { params: Promise<{ questionId: string }> }

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    await requireAdmin()
    const { questionId } = await params
    const body = await request.json()
    const input = UpdateQuestionSchema.parse(body)
    const question = await updateQuestion(questionId, input as Parameters<typeof updateQuestion>[1])
    return NextResponse.json({ question })
  } catch (error) {
    if (error instanceof z.ZodError)
      return NextResponse.json({ error: "Validasi gagal", details: error.issues }, { status: 400 })
    if (error instanceof AppError)
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(_: NextRequest, { params }: Params) {
  try {
    await requireAdmin()
    const { questionId } = await params
    await deleteQuestion(questionId)
    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof AppError)
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
