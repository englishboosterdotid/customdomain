import { getOrderStats, getPlatformRevenueSummary, findAllCertificates } from "@/lib/domains/commerce/repository/admin"
import { findAllCreators } from "@/lib/domains/microsite/repository/admin"
import { getAllPackages } from "@/lib/domains/assessment/service"
import { findAllUsers } from "@/lib/domains/commerce/repository/admin"

export default async function AdminPage() {
  const [stats, summary, creators, packages, users] = await Promise.all([
    getOrderStats(),
    getPlatformRevenueSummary(),
    findAllCreators(),
    getAllPackages(),
    findAllUsers(),
  ])

  const paidOrders = stats.find((s) => s.status === "paid")
  const activePackage = packages.find((p) => p.isActive)

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 mb-8">Admin Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <StatCard
          label="Total Revenue"
          value={`Rp ${((Number(summary?.totalRevenue) || 0) / 100).toLocaleString("id-ID")}`}
          sub="dari order paid"
        />
        <StatCard
          label="Platform Fee"
          value={`Rp ${((Number(summary?.totalFees) || 0) / 100).toLocaleString("id-ID")}`}
          sub="pendapatan platform"
        />
        <StatCard
          label="Total Creator"
          value={String(creators.length)}
          sub="terdaftar"
        />
        <StatCard
          label="Total User"
          value={String(users.length)}
          sub="akun terdaftar"
        />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-10">
        <InfoCard
          title="Exam Package Aktif"
          value={activePackage?.name ?? "Belum ada"}
          detail={
            activePackage
              ? `${activePackage.counts.total} soal — L:${activePackage.counts.listening} S:${activePackage.counts.structure} R:${activePackage.counts.reading}`
              : "Buat dan aktifkan package di menu Soal & Package"
          }
          href="/admin/questions"
          warn={!activePackage}
        />
        <InfoCard
          title="Orders Paid"
          value={`${Number(paidOrders?.count) || 0} order`}
          detail={`Rp ${((Number(paidOrders?.total) || 0) / 100).toLocaleString("id-ID")} total transaksi`}
          href="/admin/orders"
        />
      </div>

      <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-sm text-amber-700">
        <strong>Cara buat akun admin pertama:</strong> Register akun biasa → buka Drizzle Studio → 
        insert ke tabel <code className="bg-amber-100 px-1 rounded">user_roles</code> dengan 
        <code className="bg-amber-100 px-1 rounded ml-1">role = 'admin'</code> dan userId yang sesuai.
      </div>
    </div>
  )
}

function StatCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className="text-lg font-semibold text-gray-900">{value}</p>
      <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
    </div>
  )
}

function InfoCard({
  title, value, detail, href, warn,
}: {
  title: string; value: string; detail: string; href: string; warn?: boolean
}) {
  return (
    <a
      href={href}
      className={`block bg-white rounded-xl border p-5 hover:shadow-sm transition-all ${
        warn ? "border-amber-200" : "border-gray-100"
      }`}
    >
      <p className="text-xs text-gray-400 mb-1">{title}</p>
      <p className="text-base font-semibold text-gray-900 mb-1">{value}</p>
      <p className="text-xs text-gray-500">{detail}</p>
    </a>
  )
}
