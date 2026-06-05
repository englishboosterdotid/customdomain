"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

interface PackageWithCounts {
  id: string
  name: string
  description: string | null
  isActive: boolean
  counts: { listening: number; structure: number; reading: number; total: number }
}

export default function QuestionsPage() {
  const [packages, setPackages] = useState<PackageWithCounts[]>([])
  const [newName, setNewName] = useState("")
  const [newDesc, setNewDesc] = useState("")
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    const res = await fetch("/api/admin/packages")
    const data = await res.json()
    setPackages(data.packages ?? [])
  }

  useEffect(() => { load() }, [])

  async function handleAdd() {
    if (!newName.trim()) return
    setAdding(true)
    setError(null)
    const res = await fetch("/api/admin/packages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName, description: newDesc }),
    })
    const data = await res.json()
    setAdding(false)
    if (res.ok) { setNewName(""); setNewDesc(""); load() }
    else setError(data.error)
  }

  async function handleToggleActive(pkg: PackageWithCounts) {
    const res = await fetch(`/api/admin/packages/${pkg.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !pkg.isActive }),
    })
    const data = await res.json()
    if (res.ok) load()
    else setError(data.error)
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus package ini? Semua soal di dalamnya akan ikut terhapus.")) return
    const res = await fetch(`/api/admin/packages/${id}`, { method: "DELETE" })
    if (res.ok) load()
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Soal & Exam Package</h2>
      <p className="text-sm text-gray-400 mb-8">
        Kelola paket soal TOEFL. Satu package aktif digunakan untuk semua attempt.
      </p>

      {/* Tambah package baru */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 mb-6">
        <p className="text-sm font-medium text-gray-700 mb-3">Buat Package Baru</p>
        <div className="flex gap-3 mb-2">
          <input
            className="flex-1 text-sm px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            placeholder="Nama package (cth: TOEFL Simulation 2025)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <button
            onClick={handleAdd}
            disabled={adding || !newName.trim()}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-40"
          >
            {adding ? "Membuat..." : "Buat"}
          </button>
        </div>
        <input
          className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          placeholder="Deskripsi (opsional)"
          value={newDesc}
          onChange={(e) => setNewDesc(e.target.value)}
        />
        {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
      </div>

      {/* List packages */}
      {packages.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-10">Belum ada package.</p>
      ) : (
        <div className="space-y-3">
          {packages.map((pkg) => {
            const isComplete =
              pkg.counts.listening >= 50 &&
              pkg.counts.structure >= 40 &&
              pkg.counts.reading >= 50
            return (
              <div
                key={pkg.id}
                className={`bg-white rounded-xl border p-5 ${
                  pkg.isActive ? "border-indigo-200" : "border-gray-100"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-900">{pkg.name}</span>
                      {pkg.isActive && (
                        <span className="text-xs px-2 py-0.5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-full">
                          Aktif
                        </span>
                      )}
                      {!isComplete && (
                        <span className="text-xs px-2 py-0.5 bg-amber-50 text-amber-600 border border-amber-100 rounded-full">
                          Belum lengkap
                        </span>
                      )}
                    </div>
                    {/* Progress soal per section */}
                    <div className="flex gap-4 text-xs text-gray-500 mb-2">
                      <ProgressPill label="Listening" current={pkg.counts.listening} max={50} />
                      <ProgressPill label="Structure" current={pkg.counts.structure} max={40} />
                      <ProgressPill label="Reading" current={pkg.counts.reading} max={50} />
                    </div>
                    {pkg.description && (
                      <p className="text-xs text-gray-400">{pkg.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Link
                      href={`/admin/questions/${pkg.id}`}
                      className="text-xs px-3 py-1.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50"
                    >
                      Kelola Soal
                    </Link>
                    <button
                      onClick={() => handleToggleActive(pkg)}
                      disabled={!isComplete && !pkg.isActive}
                      className={`text-xs px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-40 ${
                        pkg.isActive
                          ? "border-red-100 text-red-500 hover:bg-red-50"
                          : "border-green-200 text-green-600 hover:bg-green-50"
                      }`}
                    >
                      {pkg.isActive ? "Nonaktifkan" : "Aktifkan"}
                    </button>
                    {!pkg.isActive && (
                      <button
                        onClick={() => handleDelete(pkg.id)}
                        className="text-xs px-3 py-1.5 border border-red-100 text-red-400 rounded-lg hover:bg-red-50"
                      >
                        Hapus
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function ProgressPill({ label, current, max }: { label: string; current: number; max: number }) {
  const done = current >= max
  return (
    <span className={done ? "text-green-600" : "text-amber-600"}>
      {label}: {current}/{max} {done ? "✓" : ""}
    </span>
  )
}
