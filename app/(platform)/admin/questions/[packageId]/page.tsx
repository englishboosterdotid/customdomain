"use client"

import { useEffect, useState, use } from "react"

type Section = "listening" | "structure" | "reading"
type QType = "small_talk" | "conversation" | "long_conversation" | "fill_blank" | "identify_error" | "reading_comp"

interface Question {
  id: string
  section: Section
  type: QType
  orderIndex: number
  audioKey: string | null
  content: Record<string, unknown>
  options: { key: string; text: string }[]
  correctAnswer: string
}

const SECTION_TYPES: Record<Section, { value: QType; label: string }[]> = {
  listening: [
    { value: "small_talk", label: "Small Talk" },
    { value: "conversation", label: "Conversation" },
    { value: "long_conversation", label: "Long Conversation" },
  ],
  structure: [
    { value: "fill_blank", label: "Fill in the Blank" },
    { value: "identify_error", label: "Identify Error" },
  ],
  reading: [{ value: "reading_comp", label: "Reading Comprehension" }],
}

const EMPTY_FORM = {
  section: "listening" as Section,
  type: "small_talk" as QType,
  audioKey: "",
  question: "",
  passage: "",
  sentence: "",
  options: [
    { key: "A", text: "" },
    { key: "B", text: "" },
    { key: "C", text: "" },
    { key: "D", text: "" },
  ],
  correctAnswer: "A",
}

export default function PackageDetailPage({ params }: { params: Promise<{ packageId: string }> }) {
  const { packageId } = use(params)
  const [questions, setQuestions] = useState<Question[]>([])
  const [pkg, setPkg] = useState<{ name: string; counts: Record<string, number> } | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [adding, setAdding] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState<Section>("listening")

  async function load() {
    const [qRes, pRes] = await Promise.all([
      fetch(`/api/admin/packages/${packageId}/questions`),
      fetch(`/api/admin/packages/${packageId}`),
    ])
    const { questions } = await qRes.json()
    const { package: p } = await pRes.json()
    setQuestions(questions ?? [])
    setPkg(p)
  }

  useEffect(() => { load() }, [packageId])

  // Auto-set type ketika section berubah
  useEffect(() => {
    const types = SECTION_TYPES[form.section]
    setForm((f) => ({ ...f, type: types[0].value }))
  }, [form.section])

  function buildContent() {
    if (form.section === "listening") return { question: form.question }
    if (form.section === "structure") return { sentence: form.sentence, question: form.question }
    return { passage: form.passage, question: form.question }
  }

  async function handleAdd() {
    setAdding(true)
    setError(null)
    const res = await fetch(`/api/admin/packages/${packageId}/questions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        section: form.section,
        type: form.type,
        audioKey: form.audioKey || undefined,
        content: buildContent(),
        options: form.options.filter((o) => o.text.trim()),
        correctAnswer: form.correctAnswer,
      }),
    })
    const data = await res.json()
    setAdding(false)
    if (res.ok) {
      setForm(EMPTY_FORM)
      setShowForm(false)
      load()
    } else {
      setError(data.error)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus soal ini?")) return
    const res = await fetch(
      `/api/admin/packages/${packageId}/questions/${id}`,
      { method: "DELETE" }
    )
    if (res.ok) load()
  }

  const filtered = questions.filter((q) => q.section === activeSection)
  const sectionLimit: Record<Section, number> = { listening: 50, structure: 40, reading: 50 }

  return (
    <div>
      <div className="flex items-center gap-3 mb-1">
        <a href="/admin/questions" className="text-sm text-gray-400 hover:text-gray-600">← Packages</a>
        <span className="text-gray-300">/</span>
        <h2 className="text-lg font-semibold text-gray-900">{pkg?.name ?? "..."}</h2>
      </div>

      {/* Section tabs + counts */}
      <div className="flex gap-2 mb-6 mt-6">
        {(["listening", "structure", "reading"] as Section[]).map((s) => {
          const count = pkg?.counts?.[s] ?? 0
          const limit = sectionLimit[s]
          const done = count >= limit
          return (
            <button
              key={s}
              onClick={() => setActiveSection(s)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeSection === s
                  ? "bg-indigo-600 text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}{" "}
              <span className={`ml-1 ${done ? "text-green-300" : activeSection === s ? "text-indigo-200" : "text-gray-400"}`}>
                {count}/{limit}
              </span>
            </button>
          )
        })}
        <button
          onClick={() => { setShowForm(!showForm); setForm({ ...EMPTY_FORM, section: activeSection }) }}
          className="ml-auto px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700"
        >
          + Tambah Soal
        </button>
      </div>

      {/* Form tambah soal */}
      {showForm && (
        <div className="bg-white rounded-xl border border-indigo-100 p-6 mb-6 space-y-4">
          <p className="text-sm font-medium text-gray-700">Tambah Soal Baru</p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Section</label>
              <select
                className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                value={form.section}
                onChange={(e) => setForm((f) => ({ ...f, section: e.target.value as Section }))}
              >
                <option value="listening">Listening</option>
                <option value="structure">Structure</option>
                <option value="reading">Reading</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Type</label>
              <select
                className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as QType }))}
              >
                {SECTION_TYPES[form.section].map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          {form.section === "listening" && (
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Audio Key (R2)</label>
              <input
                className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-300 font-mono"
                placeholder="audio/listening/q001.mp3"
                value={form.audioKey}
                onChange={(e) => setForm((f) => ({ ...f, audioKey: e.target.value }))}
              />
            </div>
          )}

          {form.section === "reading" && (
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Passage (teks bacaan)</label>
              <textarea
                className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
                rows={5}
                placeholder="Isi teks bacaan..."
                value={form.passage}
                onChange={(e) => setForm((f) => ({ ...f, passage: e.target.value }))}
              />
            </div>
          )}

          {(form.section === "structure") && (
            <div>
              <label className="text-xs text-gray-500 mb-1 block">
                {form.type === "fill_blank" ? "Kalimat (gunakan ___ untuk blank)" : "Kalimat (bagian yang di-underline)"}
              </label>
              <input
                className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                placeholder={form.type === "fill_blank" ? "The student ___ to school every day." : "The students goes to school."}
                value={form.sentence}
                onChange={(e) => setForm((f) => ({ ...f, sentence: e.target.value }))}
              />
            </div>
          )}

          <div>
            <label className="text-xs text-gray-500 mb-1 block">Pertanyaan</label>
            <input
              className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              placeholder="What does the man mean?"
              value={form.question}
              onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))}
            />
          </div>

          {/* Options */}
          <div>
            <label className="text-xs text-gray-500 mb-2 block">Pilihan Jawaban</label>
            <div className="space-y-2">
              {form.options.map((opt, i) => (
                <div key={opt.key} className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-500 w-5">{opt.key}</span>
                  <input
                    className="flex-1 text-sm px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    placeholder={`Pilihan ${opt.key}`}
                    value={opt.text}
                    onChange={(e) => {
                      const opts = [...form.options]
                      opts[i] = { ...opts[i], text: e.target.value }
                      setForm((f) => ({ ...f, options: opts }))
                    }}
                  />
                  <input
                    type="radio"
                    name="correctAnswer"
                    value={opt.key}
                    checked={form.correctAnswer === opt.key}
                    onChange={() => setForm((f) => ({ ...f, correctAnswer: opt.key }))}
                    className="accent-indigo-600"
                    title="Jawaban benar"
                  />
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-1">Klik radio button di kanan untuk menandai jawaban benar.</p>
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={adding}
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {adding ? "Menyimpan..." : "Simpan Soal"}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* List soal */}
      {filtered.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-10">
          Belum ada soal di section {activeSection}.
        </p>
      ) : (
        <div className="space-y-2">
          {filtered.map((q) => (
            <div key={q.id} className="bg-white rounded-xl border border-gray-100 p-4 flex gap-4">
              <span className="text-xs font-mono text-gray-400 w-6 shrink-0 pt-0.5">
                {q.orderIndex}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">
                    {q.type.replace(/_/g, " ")}
                  </span>
                  {q.audioKey && (
                    <span className="text-xs text-indigo-500 font-mono">{q.audioKey}</span>
                  )}
                </div>
                <p className="text-sm text-gray-700 truncate">
                  {(q.content as Record<string, string>).question ?? (q.content as Record<string, string>).sentence ?? ""}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Jawaban: <span className="font-medium text-gray-600">{q.correctAnswer}</span>
                  {" · "}
                  {q.options.map((o) => o.key).join(" ")}
                </p>
              </div>
              <button
                onClick={() => handleDelete(q.id)}
                className="text-xs text-red-400 hover:text-red-600 shrink-0"
              >
                Hapus
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
