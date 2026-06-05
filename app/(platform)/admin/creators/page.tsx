"use client"

import { useEffect, useState } from "react"

interface Creator {
  id: string
  username: string
  displayName: string
  tier: "free" | "pro" | "enterprise"
  isActive: boolean
  createdAt: string
}

const TIER_COLORS = {
  free: "bg-gray-100 text-gray-600",
  pro: "bg-indigo-50 text-indigo-600",
  enterprise: "bg-purple-50 text-purple-600",
}

export default function CreatorsPage() {
  const [creators, setCreators] = useState<Creator[]>([])
  const [updating, setUpdating] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    const res = await fetch("/api/admin/creators")
    const data = await res.json()
    setCreators(data.creators ?? [])
  }

  useEffect(() => { load() }, [])

  async function update(id: string, data: { tier?: string; isActive?: boolean }) {
    setUpdating(id)
    setError(null)
    const res = await fetch(`/api/admin/creators/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    const resp = await res.json()
    setUpdating(null)
    if (res.ok) load()
    else setError(resp.error)
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Creator Management</h2>
      <p className="text-sm text-gray-400 mb-8">Kelola tier dan status creator.</p>

      {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Creator</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Tier</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Status</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {creators.map((c) => (
              <tr key={c.id}>
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">{c.displayName}</p>
                  <p className="text-xs text-gray-400">/{c.username}</p>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={c.tier}
                    disabled={updating === c.id}
                    onChange={(e) => update(c.id, { tier: e.target.value })}
                    className={`text-xs px-2 py-1 rounded-lg border-0 font-medium cursor-pointer ${TIER_COLORS[c.tier]}`}
                  >
                    <option value="free">Free</option>
                    <option value="pro">Pro</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${c.isActive ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"}`}>
                    {c.isActive ? "Aktif" : "Nonaktif"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => update(c.id, { isActive: !c.isActive })}
                    disabled={updating === c.id}
                    className="text-xs text-gray-500 hover:text-gray-800 disabled:opacity-40"
                  >
                    {c.isActive ? "Nonaktifkan" : "Aktifkan"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {creators.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-10">Belum ada creator.</p>
        )}
      </div>
    </div>
  )
}
