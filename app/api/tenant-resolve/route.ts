import { NextRequest, NextResponse } from "next/server"
import { resolveTenantByDomain } from "@/lib/domains/microsite/service"

/**
 * Internal endpoint — dipanggil oleh middleware untuk resolve
 * custom domain ke creator context.
 *
 * GET /api/tenant-resolve?domain=usercustom.com&path=/products
 */
export async function GET(request: NextRequest) {
  const domain = request.nextUrl.searchParams.get("domain")
  const path = request.nextUrl.searchParams.get("path") ?? "/"

  if (!domain) {
    return NextResponse.json({ error: "domain required" }, { status: 400 })
  }

  const tenant = await resolveTenantByDomain(domain)

  if (!tenant) {
    return NextResponse.json({ error: "Domain not found" }, { status: 404 })
  }

  // Rewrite ke microsite page dengan context yang sudah di-resolve
  const rewriteUrl = new URL(
    `/${tenant.creator.username}${path}`,
    request.nextUrl.origin
  )

  const response = NextResponse.rewrite(rewriteUrl)
  response.headers.set("x-tenant-id", tenant.creator.id)
  response.headers.set("x-tenant-username", tenant.creator.username)
  response.headers.set("x-tenant-whitelabel", String(tenant.isWhiteLabel))

  return response
}
