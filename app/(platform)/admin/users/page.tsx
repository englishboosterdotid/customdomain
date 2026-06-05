"use client"

import { useEffect, useState } from "react"

interface User {
  id: string; name: string; email: string; emailVerified: boolean; createdAt: string
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [assigning, setAssigning] = useState<string | null>(null)

  async function load() {
    const res = await fetch("/api/admin/users")
    const data = await res.json()
    setUsers(data.users ?? [])
  }

  useEffect(() => { load() }, [])

  async function assignRole(userId: string, role: string) {
    setAssigning(userId)
    await fetch(`/api/admin/users/${userId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    })
    setAssigning(null)
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Users</h2>
      <p className="text-sm text-gray-400 mb-8">Kelola akun dan role user.</p>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">User</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Verified</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Assign Role</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">{u.name}</p>
                  <p className="text-xs text-gray-400">{u.email}</p>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs ${u.emailVerified ? "text-green-600" : "text-gray-400"}`}>
                    {u.emailVerified ? "✓ Verified" : "Unverified"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    {["creator", "admin"].map((role) => (
                      <button
                        key={role}
                        onClick={() => assignRole(u.id, role)}
                        disabled={assigning === u.id}
                        className="text-xs px-2 py-1 border border-gray-200 text-gray-500 rounded hover:bg-gray-50 disabled:opacity-40"
                      >
                        +{role}
                      </button>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-gray-400">
                  {new Date(u.createdAt).toLocaleDateString("id-ID")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-10">Belum ada user.</p>
        )}
      </div>
    </div>
  )
}
