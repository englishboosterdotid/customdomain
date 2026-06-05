"use client"

import { useEffect, useState } from "react"

interface CertRow {
  certificate: {
    id: string; code: string; holderName: string
    totalScore: number; issuedAt: string; pdfKey: string | null
  }
  userName: string
  userEmail: string
}

export default function CertificatesPage() {
  const [certs, setCerts] = useState<CertRow[]>([])

  useEffect(() => {
    fetch("/api/admin/certificates").then((r) => r.json()).then((d) => setCerts(d.certificates ?? []))
  }, [])

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Sertifikat</h2>
      <p className="text-sm text-gray-400 mb-8">Audit semua sertifikat yang telah diterbitkan.</p>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Holder</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Code</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Score</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Issued</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {certs.map(({ certificate: c, userName, userEmail }) => (
              <tr key={c.id}>
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">{c.holderName}</p>
                  <p className="text-xs text-gray-400">{userEmail}</p>
                </td>
                <td className="px-4 py-3">
                  <a
                    href={`/verify/${c.code}`}
                    target="_blank"
                    className="text-xs font-mono text-indigo-500 hover:underline"
                  >
                    {c.code}
                  </a>
                </td>
                <td className="px-4 py-3 font-medium">{c.totalScore}</td>
                <td className="px-4 py-3 text-xs text-gray-400">
                  {new Date(c.issuedAt).toLocaleDateString("id-ID")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {certs.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-10">Belum ada sertifikat.</p>
        )}
      </div>
    </div>
  )
}
