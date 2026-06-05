import { redirect } from "next/navigation"
import Link from "next/link"
import { getSession, sessionHasRole } from "@/lib/auth/session"

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/questions", label: "Soal & Package" },
  { href: "/admin/creators", label: "Creator" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/wallet", label: "Revenue" },
  { href: "/admin/certificates", label: "Sertifikat" },
  { href: "/admin/users", label: "Users" },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect("/login")
  if (!sessionHasRole(session, "admin")) redirect("/dashboard")

  return (
    <div className="min-h-screen flex">
      <aside className="w-52 shrink-0 border-r border-gray-100 bg-white px-4 py-6 flex flex-col gap-1">
        <div className="mb-6 px-2">
          <span className="font-semibold text-gray-900">Toeflynk</span>
          <p className="text-xs text-red-400 mt-0.5 font-medium">Admin Panel</p>
        </div>
        {NAV.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className="px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
          >
            {n.label}
          </Link>
        ))}
        <div className="mt-auto pt-6 border-t border-gray-100">
          <p className="text-xs text-gray-400 px-2 truncate">{session.email}</p>
        </div>
      </aside>
      <main className="flex-1 bg-gray-50 min-h-screen">
        <div className="max-w-5xl mx-auto px-8 py-10">{children}</div>
      </main>
    </div>
  )
}
