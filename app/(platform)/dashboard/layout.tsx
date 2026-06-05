import { redirect } from "next/navigation"
import Link from "next/link"
import { getSession, sessionHasRole } from "@/lib/auth/session"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()

  if (!session) redirect("/login")
  if (!sessionHasRole(session, "creator")) redirect("/register/creator")

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-r border-gray-100 bg-white px-4 py-6 flex flex-col gap-1">
        <div className="mb-6 px-2">
          <span className="font-semibold text-gray-900">Toeflynk</span>
          <p className="text-xs text-gray-400 mt-0.5">Creator Dashboard</p>
        </div>

        <NavLink href="/dashboard">Beranda</NavLink>
        <NavLink href="/dashboard/microsite">Microsite</NavLink>
        <NavLink href="/dashboard/domain">Custom Domain</NavLink>
        <NavLink href="/dashboard/offerings">Produk</NavLink>

        <div className="mt-auto pt-6 border-t border-gray-100">
          <p className="text-xs text-gray-400 px-2 truncate">{session.email}</p>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 bg-gray-50 min-h-screen">
        <div className="max-w-3xl mx-auto px-8 py-10">
          {children}
        </div>
      </main>
    </div>
  )
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
    >
      {children}
    </Link>
  )
}
