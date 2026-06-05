"use client"

import { useEffect, useState } from "react"

interface CustomDomain {
  id: string
  domain: string
  isWhiteLabel: boolean
  isVerified: boolean
  sslProvisioned: boolean
  createdAt: string
}

interface CreatorInfo {
  tier: string
  username: string
}

export default function DomainPage() {
  const [domains, setDomains] = useState<CustomDomain[]>([])
  const [creator, setCreator] = useState<CreatorInfo | null>(null)
  const [newDomain, setNewDomain] = useState("")
  const [isWhiteLabel, setIsWhiteLabel] = useState(false)
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function load() {
    const [domRes, crRes] = await Promise.all([
      fetch("/api/dashboard/domain"),
      fetch("/api/dashboard/microsite"),
    ])
    const { domains } = await domRes.json()
    const { creator } = await crRes.json()
    setDomains(domains ?? [])
    setCreator(creator)
  }

  useEffect(() => { load() }, [])

  async function handleAdd() {
    if (!newDomain.trim()) return
    setAdding(true)
    setError(null)
    setSuccess(null)

    const res = await fetch("/api/dashboard/domain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ domain: newDomain.trim(), isWhiteLabel }),
    })
    const data = await res.json()
    setAdding(false)

    if (res.ok) {
      setNewDomain("")
      setIsWhiteLabel(false)
      setSuccess("Domain berhasil ditambahkan. Sekarang arahkan CNAME domain kamu ke toeflynk.com lalu klik Verifikasi.")
      load()
    } else {
      setError(data.error ?? "Gagal menambahkan domain")
    }
  }

  async function handleVerify(domainId: string) {
    const res = await fetch("/api/dashboard/domain", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ domainId, action: "verify" }),
    })
    const data = await res.json()
    if (res.ok) {
      setSuccess(data.message)
      load()
    } else {
      setError(data.error)
    }
  }

  async function handleToggleWhiteLabel(domainId: string, current: boolean) {
    const res = await fetch("/api/dashboard/domain", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ domainId, action: "toggle_whitelabel", isWhiteLabel: !current }),
    })
    const data = await res.json()
    if (res.ok) {
      load()
    } else {
      setError(data.error)
    }
  }

  async function handleDelete(domainId: string) {
    if (!confirm("Hapus domain ini?")) return
    const res = await fetch("/api/dashboard/domain", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ domainId }),
    })
    if (res.ok) load()
  }

  const isProTier = creator?.tier === "pro" || creator?.tier === "enterprise"

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Custom Domain</h2>
      <p className="text-sm text-gray-400 mb-8">
        Hubungkan domain sendiri agar microsite kamu bisa diakses tanpa redirect.
      </p>

      {/* Cara kerja */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5 mb-8">
        <p className="text-sm font-medium text-indigo-800 mb-3">Cara setup custom domain</p>
        <ol className="text-sm text-indigo-700 space-y-1.5 list-decimal list-inside">
          <li>Tambahkan domain di bawah ini</li>
          <li>
            Di DNS provider kamu, buat record:{" "}
            <code className="bg-indigo-100 px-1.5 py-0.5 rounded text-xs font-mono">
              CNAME @ → toeflynk.com
            </code>
          </li>
          <li>Klik tombol <strong>Verifikasi</strong> setelah DNS propagasi (bisa 1–24 jam)</li>
          <li>Setelah terverifikasi, domain langsung aktif tanpa redirect</li>
        </ol>
      </div>

      {/* Tambah domain baru */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
        <p className="text-sm font-medium text-gray-700 mb-4">Tambah Domain Baru</p>

        <div className="flex gap-3 mb-4">
          <input
            className="flex-1 text-sm px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-300 font-mono"
            placeholder="contoh: mybrand.com"
            value={newDomain}
            onChange={(e) => setNewDomain(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
          <button
            onClick={handleAdd}
            disabled={adding || !newDomain.trim()}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-40 transition-colors"
          >
            {adding ? "Menambahkan..." : "Tambah"}
          </button>
        </div>

        {/* White-label toggle */}
        <label className={`flex items-start gap-3 cursor-pointer ${!isProTier ? "opacity-40" : ""}`}>
          <input
            type="checkbox"
            checked={isWhiteLabel}
            onChange={(e) => isProTier && setIsWhiteLabel(e.target.checked)}
            disabled={!isProTier}
            className="mt-0.5 accent-indigo-600"
          />
          <div>
            <p className="text-sm font-medium text-gray-700">
              White-label
              {!isProTier && (
                <span className="ml-2 text-xs text-amber-600 font-normal">
                  — Upgrade ke Pro untuk mengaktifkan
                </span>
              )}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              Sembunyikan semua branding Toeflynk. Domain ini akan terlihat seperti platform kamu sendiri.
            </p>
          </div>
        </label>

        {error && <p className="text-sm text-red-500 mt-3">{error}</p>}
        {success && <p className="text-sm text-green-600 mt-3">{success}</p>}
      </div>

      {/* Daftar domain */}
      {domains.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-10">
          Belum ada custom domain. Tambahkan di atas.
        </p>
      ) : (
        <div className="space-y-3">
          {domains.map((d) => (
            <div
              key={d.id}
              className="bg-white rounded-xl border border-gray-100 p-5 flex flex-col sm:flex-row sm:items-center gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-mono font-medium text-gray-900 truncate">
                    {d.domain}
                  </span>
                  <StatusBadge verified={d.isVerified} />
                  {d.isWhiteLabel && (
                    <span className="text-xs px-2 py-0.5 bg-purple-50 text-purple-600 rounded-full border border-purple-100">
                      white-label
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400">
                  {d.isVerified
                    ? `Aktif — mengakses domain ini akan menampilkan microsite /${creator?.username}`
                    : "Menunggu verifikasi — pastikan CNAME sudah diarahkan ke toeflynk.com"}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {!d.isVerified && (
                  <button
                    onClick={() => handleVerify(d.id)}
                    className="text-xs px-3 py-1.5 border border-indigo-200 text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors"
                  >
                    Verifikasi
                  </button>
                )}

                {d.isVerified && isProTier && (
                  <button
                    onClick={() => handleToggleWhiteLabel(d.id, d.isWhiteLabel)}
                    className="text-xs px-3 py-1.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {d.isWhiteLabel ? "Nonaktifkan WL" : "Aktifkan WL"}
                  </button>
                )}

                <button
                  onClick={() => handleDelete(d.id)}
                  className="text-xs px-3 py-1.5 border border-red-100 text-red-400 rounded-lg hover:bg-red-50 transition-colors"
                >
                  Hapus
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function StatusBadge({ verified }: { verified: boolean }) {
  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-full border ${
        verified
          ? "bg-green-50 text-green-600 border-green-100"
          : "bg-amber-50 text-amber-600 border-amber-100"
      }`}
    >
      {verified ? "✓ Aktif" : "Menunggu"}
    </span>
  )
}
