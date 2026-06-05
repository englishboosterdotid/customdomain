import { headers } from "next/headers"
import { auth } from "./index"
import { getUserRoles } from "@/lib/domains/identity/repository"
import type { Role } from "@/lib/domains/identity/types"

export interface SessionUser {
  id: string
  email: string
  name: string
  roles: Role[]
}

/**
 * Ambil session dari Server Component atau Route Handler.
 * Return null jika tidak ada session aktif.
 */
export async function getSession(): Promise<SessionUser | null> {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user) return null

  const roles = await getUserRoles(session.user.id)

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    roles,
  }
}

/**
 * Ambil session dan throw UnauthorizedError jika tidak ada.
 * Gunakan di protected routes.
 */
export async function requireSession(): Promise<SessionUser> {
  const session = await getSession()
  if (!session) {
    const { UnauthorizedError } = await import("@/lib/shared/errors")
    throw new UnauthorizedError()
  }
  return session
}

export function sessionHasRole(session: SessionUser, role: Role): boolean {
  return session.roles.includes(role)
}
