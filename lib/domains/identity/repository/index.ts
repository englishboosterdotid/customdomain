import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { users, userRoles } from "@/lib/db/schema"
import type { Role, User, UserWithRoles } from "../types"

export async function findUserById(id: string): Promise<User | null> {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1)

  return result[0] ?? null
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1)

  return result[0] ?? null
}

export async function findUserWithRoles(id: string): Promise<UserWithRoles | null> {
  const user = await findUserById(id)
  if (!user) return null

  const roles = await db
    .select({ role: userRoles.role })
    .from(userRoles)
    .where(eq(userRoles.userId, id))

  return {
    ...user,
    roles: roles.map((r) => r.role as Role),
  }
}

export async function getUserRoles(userId: string): Promise<Role[]> {
  const result = await db
    .select({ role: userRoles.role })
    .from(userRoles)
    .where(eq(userRoles.userId, userId))

  return result.map((r) => r.role as Role)
}

export async function assignRole(userId: string, role: Role): Promise<void> {
  // Upsert — tidak error kalau role sudah ada
  await db
    .insert(userRoles)
    .values({ userId, role })
    .onConflictDoNothing()
}

export async function hasRole(userId: string, role: Role): Promise<boolean> {
  const result = await db
    .select({ role: userRoles.role })
    .from(userRoles)
    .where(eq(userRoles.userId, userId))
    .limit(1)

  return result.some((r) => r.role === role)
}
