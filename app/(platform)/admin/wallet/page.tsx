"use client"

import { useEffect, useState } from "react"

export default function WalletPage() {
  const [summary, setSummary] = useState<{
    totalRevenue: number; totalFees: number; totalCreatorEarnings: number; totalOrders: number
  } | null>(null)
  const [earnings, setEarnings] = useState<{
    creatorId: string; username: string; displayName: string; totalEarning: number
  }[]>([])

  useEffect(() => {
    fetch("/api/admin/wallet").then((r) => r.json()).then((d) => {
      setSummary(d.summary)
      setEarnings(d.creatorEarnings ?? [])
    })
  }, [])

  const fmt = (n: number) => `Rp ${(n / 100).toLocaleString("id-ID")}`

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Revenue & Wallet</h2>
      <p className="text-sm text-gray-400 mb-8">Ringkasan pendapatan platform dan creator.</p>

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <StatCard label="Total Revenue" value={fmt(Number(summary.totalRevenue))} />
          <StatCard label="Platform Fee" value={fmt(Number(summary.totalFees))} />
          <StatCard label="Creator Earnings" value={fmt(Number(summary.totalCreatorEarnings))} />
          <StatCard label="Paid Orders" value={String(summary.totalOrders)} />
        </div>
      )}

      <h3 className="text-sm font-medium text-gray-700 mb-3">Earning per Creator</h3>
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Creator</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Total Earning</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {earnings.map((e) => (
              <tr key={e.creatorId}>
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">{e.displayName}</p>
                  <p className="text-xs text-gray-400">/{e.username}</p>
                </td>
                <td className="px-4 py-3 font-medium">{fmt(Number(e.totalEarning))}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {earnings.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-10">Belum ada data earning.</p>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className="text-base font-semibold text-gray-900">{value}</p>
    </div>
  )
}
