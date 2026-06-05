import { getSession } from "@/lib/auth/session"
import { getCreatorByUserId } from "@/lib/domains/microsite/service"
import { getCreatorDomains } from "@/lib/domains/microsite/service/domain"
import { getWalletBalance } from "@/lib/domains/wallet/service"
import Link from "next/link"

export default async function DashboardPage() {
  const session = await getSession()
  const creator = await getCreatorByUserId(session!.id)
  if (!creator) return null

  const [domains, walletBalance] = await Promise.all([
    getCreatorDomains(creator.id),
    getWalletBalance(creator.id),
  ])

  const activeDomains = domains.filter((d) => d.isVerified)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 mb-1">
        Halo, {creator.displayName} 👋
      </h1>
      <p className="text-sm text-gray-400 mb-8">
        Microsite kamu aktif di{" "}
        <a
          href={`${appUrl}/${creator.username}`}
          target="_blank"
          className="text-indigo-500 hover:underline"
        >
          /{creator.username}
        </a>
      </p>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard label="Tier" value={creator.tier.toUpperCase()} />
        <StatCard
          label="Saldo Wallet"
          value={`Rp ${(walletBalance / 100).toLocaleString("id-ID")}`}
        />
        <StatCard label="Custom Domain" value={String(activeDomains.length)} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <QuickAction href="/dashboard/microsite" title="Edit Microsite" desc="Ubah tampilan, bio, dan warna brand" />
        <QuickAction href="/dashboard/domain" title="Custom Domain" desc="Hubungkan domain sendiri atau aktifkan white-label" />
        <QuickAction href="/dashboard/offerings" title="Kelola Produk" desc="Tambah atau ubah produk TOEFL kamu" />
        <QuickAction
          href={`${appUrl}/${creator.username}`}
          title="Lihat Microsite"
          desc="Preview tampilan publik"
          external
        />
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className="text-lg font-semibold text-gray-900">{value}</p>
    </div>
  )
}

function QuickAction({
  href,
  title,
  desc,
  external,
}: {
  href: string
  title: string
  desc: string
  external?: boolean
}) {
  return (
    <Link
      href={href}
      target={external ? "_blank" : undefined}
      className="bg-white rounded-xl border border-gray-100 p-4 hover:border-indigo-200 hover:shadow-sm transition-all block"
    >
      <p className="text-sm font-medium text-gray-900 mb-0.5">{title}</p>
      <p className="text-xs text-gray-400">{desc}</p>
    </Link>
  )
}
