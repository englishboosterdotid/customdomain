import { notFound } from "next/navigation"
import { headers } from "next/headers"
import { resolveTenantByUsername, resolveTenantByDomain } from "@/lib/domains/microsite/service"

interface Props {
  params: Promise<{ username: string }>
}

export default async function MicrositePage({ params }: Props) {
  const headersList = await headers()
  const host = headersList.get("x-original-host") || headersList.get("host") || ""

  let tenant

  // Cek apakah ini custom domain (ada x-tenant-whitelabel header atau host bukan platform domain
  const isWhiteLabelHeader = headersList.get("x-tenant-whitelabel")
  const tenantUsername = headersList.get("x-tenant-username")

  if (tenantUsername) {
    // Dari custom domain, resolve dengan domain asli untuk dapat isWhiteLabel yang benar
    // Karena rewrite dari tenant-resolve sudah memberi kita username, tapi kita resolve domain untuk isWhiteLabel kita ambil dari resolveTenantByDomain
    // Wait, lebih baik kita resolve dari host asli
    const originalHost = headersList.get("x-original-host") || host
    if (originalHost && !originalHost.includes("toeflynk.com") && !originalHost.includes("localhost")) {
      tenant = await resolveTenantByDomain(originalHost)
    }
  }

  // Fallback ke path-based jika tidak dapat dari custom domain
  if (!tenant) {
    const { username } = await params
    tenant = await resolveTenantByUsername(username)
  }

  if (!tenant) notFound()

  const { creator, isWhiteLabel } = tenant

  return (
    <main>
      {!isWhiteLabel && (
        <div className="text-xs text-center py-1 bg-gray-50 text-gray-400">
          Powered by Toeflynk
        </div>
      )}
      <div className="max-w-2xl mx-auto px-4 py-12">
        {creator.logoUrl && (
          <img
            src={creator.logoUrl}
            alt={creator.displayName}
            className="w-20 h-20 rounded-full mb-4"
          />
        )}
        <h1 className="text-2xl font-semibold">{creator.displayName}</h1>
        {creator.bio && (
          <p className="mt-2 text-gray-600">{creator.bio}</p>
        )}
        {/* Offerings akan ditambahkan setelah Commerce domain selesai */}
        <div className="mt-8 text-gray-400 text-sm">
          Produk akan muncul di sini.
        </div>
      </div>
    </main>
  )
}

export async function generateMetadata({ params }: Props) {
  const headersList = await headers()
  const host = headersList.get("x-original-host") || headersList.get("host") || ""
  const tenantUsername = headersList.get("x-tenant-username")

  let tenant

  if (tenantUsername) {
    const originalHost = headersList.get("x-original-host") || host
    if (originalHost && !originalHost.includes("toeflynk.com") && !originalHost.includes("localhost")) {
      tenant = await resolveTenantByDomain(originalHost)
    }
  }

  if (!tenant) {
    const { username } = await params
    tenant = await resolveTenantByUsername(username)
  }

  if (!tenant) return {}

  return {
    title: tenant.creator.displayName,
    description: tenant.creator.bio ?? `Produk TOEFL dari ${tenant.creator.displayName}`,
  }
}
