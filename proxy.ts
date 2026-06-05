import { NextRequest, NextResponse } from "next/server"
import { resolveTenantByDomain } from "./lib/domains/microsite/service"

// Platform domain utama
const PLATFORM_DOMAIN = "toeflynk.com"
const PLATFORM_SUBDOMAINS = ["www.toeflynk.com", "localhost:3000", "localhost"]

export async function proxy(request: NextRequest) {
  const host = request.headers.get("host") ?? ""
  const pathname = request.nextUrl.pathname

  // Skip middleware untuk API routes, assets, dan platform routes
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname === "/favicon.ico" ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register")
  ) {
    return NextResponse.next()
  }

  // Cek apakah host adalah platform domain (Mode 1: path-based)
  const isPlatformDomain = PLATFORM_SUBDOMAINS.includes(host) || host.endsWith(`.${PLATFORM_DOMAIN}`)

  if (isPlatformDomain) {
    // Mode 1: path-based, lanjut ke Next.js routing normal
    return NextResponse.next()
  }

  // Mode 2 & 3: custom domain
  const tenant = await resolveTenantByDomain(host)

  if (!tenant) {
    // Domain tidak ditemukan, 404
    return new NextResponse("Not Found", { status: 404 })
  }

  // Rewrite ke microsite path dengan tenant context via headers
  const rewriteUrl = new URL(
    `/${tenant.creator.username}${pathname}`,
    request.nextUrl.origin
  )

  const response = NextResponse.rewrite(rewriteUrl)
  
  // Set request headers that will be available to the page component
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set("x-tenant-id", tenant.creator.id)
  requestHeaders.set("x-tenant-username", tenant.creator.username)
  requestHeaders.set("x-tenant-whitelabel", String(tenant.isWhiteLabel))
  requestHeaders.set("x-original-host", host)

  return NextResponse.rewrite(rewriteUrl, {
    request: {
      headers: requestHeaders,
    },
  })
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
}
