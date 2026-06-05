"use client"

import { useEffect, useState } from "react"

interface Order {
  id: string
  buyerName: string
  buyerEmail: string
  amountIDR: number
  platformFeeIDR: number
  status: string
  midtransOrderId: string | null
  paidAt: string | null
  createdAt: string
}

const STATUS_COLORS: Record<string, string> = {
  paid: "bg-green-50 text-green-600",
  pending: "bg-amber-50 text-amber-600",
  failed: "bg-red-50 text-red-500",
  expired: "bg-gray-100 text-gray-500",
  refunded: "bg-purple-50 text-purple-600",
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [stats, setStats] = useState<{ status: string; count: number; total: number }[]>([])
  const [filter, setFilter] = useState("")

  async function load(status?: string) {
    const url = status ? `/api/admin/orders?status=${status}` : "/api/admin/orders"
    const res = await fetch(url)
    const data = await res.json()
    setOrders(data.orders ?? [])
    setStats(data.stats ?? [])
  }

  useEffect(() => { load() }, [])

  function handleFilter(s: string) {
    setFilter(s)
    load(s || undefined)
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Orders</h2>
      <p className="text-sm text-gray-400 mb-6">Monitor semua transaksi.</p>

      {/* Stats */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <FilterChip label="Semua" value="" current={filter} onClick={handleFilter} count={orders.length} />
        {["paid","pending","failed","expired"].map((s) => {
          const stat = stats.find((x) => x.status === s)
          return (
            <FilterChip
              key={s}
              label={s.charAt(0).toUpperCase() + s.slice(1)}
              value={s}
              current={filter}
              onClick={handleFilter}
              count={Number(stat?.count) ?? 0}
            />
          )
        })}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Buyer</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Amount</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Status</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Tanggal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {orders.map((o) => (
              <tr key={o.id}>
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">{o.buyerName}</p>
                  <p className="text-xs text-gray-400">{o.buyerEmail}</p>
                  {o.midtransOrderId && (
                    <p className="text-xs font-mono text-gray-300">{o.midtransOrderId}</p>
                  )}
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium">Rp {(o.amountIDR / 100).toLocaleString("id-ID")}</p>
                  <p className="text-xs text-gray-400">
                    Fee: Rp {(o.platformFeeIDR / 100).toLocaleString("id-ID")}
                  </p>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[o.status] ?? "bg-gray-100 text-gray-500"}`}>
                    {o.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-400">
                  {new Date(o.createdAt).toLocaleDateString("id-ID")}
                  {o.paidAt && (
                    <p className="text-green-500">
                      Paid: {new Date(o.paidAt).toLocaleDateString("id-ID")}
                    </p>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {orders.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-10">Belum ada order.</p>
        )}
      </div>
    </div>
  )
}

function FilterChip({ label, value, current, onClick, count }: {
  label: string; value: string; current: string; onClick: (v: string) => void; count: number
}) {
  return (
    <button
      onClick={() => onClick(value)}
      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
        current === value
          ? "bg-indigo-600 text-white"
          : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
      }`}
    >
      {label} {count > 0 && <span className="opacity-70">({count})</span>}
    </button>
  )
}
