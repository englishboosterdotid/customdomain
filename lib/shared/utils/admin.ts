import { requireSession, sessionHasRole } from "@/lib/auth/session"
import { ForbiddenError } from "@/lib/shared/errors"
import type { SessionUser } from "@/lib/auth/session"

export async function requireAdmin(): Promise<SessionUser> {
  const session = await requireSession()
  if (!sessionHasRole(session, "admin")) {
    throw new ForbiddenError("Akses admin diperlukan")
  }
  return session
}
