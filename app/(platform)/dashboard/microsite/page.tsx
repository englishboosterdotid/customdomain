"use client"

import { useEffect, useState } from "react"

interface Creator {
  id: string
  username: string
  displayName: string
  bio: string | null
  primaryColor: string
  logoUrl: string | null
  tier: string
}

export default function MicrositePage() {
  const [creator, setCreator] = useState<Creator | null>(null)
  const [form, setForm] = useState({ displayName: "", bio: "", primaryColor: "#6366f1" })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null)

  useEffect(() => {
    fetch("/api/dashboard/microsite")
      .then((r) => r.json())
      .then(({ creator }) => {
        setCreator(creator)
        setForm({
          displayName: creator.displayName ?? "",
          bio: creator.bio ?? "",
          primaryColor: creator.primaryColor ?? "#6366f1",
        })
      })
  }, [])

  async function handleSave() {
    setSaving(true)
    setMessage(null)
    const res = await fetch("/api/dashboard/microsite", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    setSaving(false)
    if (res.ok) {
      setCreator(data.creator)
      setMessage({ type: "ok", text: "Microsite berhasil disimpan" })
    } else {
      setMessage({ type: "err", text: data.error ?? "Gagal menyimpan" })
    }
  }

  if (!creator) return <div className="text-sm text-gray-400">Memuat...</div>

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Microsite Settings</h2>
      <p className="text-sm text-gray-400 mb-8">
        Ubah tampilan publik microsite kamu di{" "}
        <span className="text-indigo-500">/{creator.username}</span>
      </p>

      <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50">
        <Field label="Display Name" hint="Nama yang ditampilkan di microsite kamu">
          <input
            className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            value={form.displayName}
            onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
            maxLength={100}
          />
        </Field>

        <Field label="Bio" hint="Deskripsi singkat tentang kamu atau produkmu">
          <textarea
            className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
            rows={3}
            value={form.bio}
            onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
            maxLength={500}
          />
        </Field>

        <Field label="Warna Brand" hint="Warna utama yang digunakan di microsite">
          <div className="flex items-center gap-3">
            <input
              type="color"
              className="w-10 h-10 rounded cursor-pointer border border-gray-200"
              value={form.primaryColor}
              onChange={(e) => setForm((f) => ({ ...f, primaryColor: e.target.value }))}
            />
            <span className="text-sm font-mono text-gray-500">{form.primaryColor}</span>
          </div>
        </Field>
      </div>

      {message && (
        <p className={`text-sm mt-4 ${message.type === "ok" ? "text-green-600" : "text-red-500"}`}>
          {message.text}
        </p>
      )}

      <div className="mt-6 flex gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {saving ? "Menyimpan..." : "Simpan Perubahan"}
        </button>
        <a
          href={`${process.env.NEXT_PUBLIC_APP_URL}/${creator.username}`}
          target="_blank"
          className="px-5 py-2 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition-colors"
        >
          Preview Microsite →
        </a>
      </div>
    </div>
  )
}

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint: string
  children: React.ReactNode
}) {
  return (
    <div className="px-6 py-5">
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <div className="sm:w-48 shrink-0">
          <p className="text-sm font-medium text-gray-700">{label}</p>
          <p className="text-xs text-gray-400 mt-0.5">{hint}</p>
        </div>
        <div className="flex-1">{children}</div>
      </div>
    </div>
  )
}
