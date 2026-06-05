"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

export default function RegisterCreatorPage() {
  const router = useRouter()
  const [form, setForm] = useState({ username: "", displayName: "" })
  const [availability, setAvailability] = useState<{available: boolean; reason?: string} | null>(null)
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Debounce username check
  useEffect(() => {
    if (!form.username || form.username.length < 3) {
      setAvailability(null)
      return
    }
    const timer = setTimeout(async () => {
      setChecking(true)
      const res = await fetch(`/api/creator/username-check?username=${form.username}`)
      const data = await res.json()
      setAvailability(data)
      setChecking(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [form.username])

  async function handleSubmit() {
    setLoading(true)
    setError(null)
    const res = await fetch("/api/creator", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    setLoading(false)
    if (res.ok) {
      router.push("/dashboard")
    } else {
      setError(data.error ?? "Pendaftaran gagal")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-gray-900">Setup Creator</h1>
          <p className="text-sm text-gray-400 mt-1">Buat microsite kamu di Toeflynk</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Username</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                toeflynk.com/
              </span>
              <input
                className="w-full text-sm pl-28 pr-3 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                placeholder="username"
                value={form.username}
                onChange={(e) => setForm((f) => ({ ...f, username: e.target.value.toLowerCase() }))}
              />
            </div>
            {form.username.length >= 3 && (
              <p className={`text-xs mt-1.5 ${
                checking ? "text-gray-400" :
                availability?.available ? "text-green-600" : "text-red-500"
              }`}>
                {checking ? "Memeriksa..." :
                  availability?.available ? "✓ Username tersedia" :
                  availability?.reason ?? "Username tidak tersedia"}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Display Name</label>
            <input
              className="w-full text-sm px-3 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              placeholder="Nama yang ditampilkan"
              value={form.displayName}
              onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
            />
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={loading || !availability?.available || !form.displayName}
            className="w-full py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Membuat..." : "Buat Microsite"}
          </button>
        </div>
      </div>
    </div>
  )
}
