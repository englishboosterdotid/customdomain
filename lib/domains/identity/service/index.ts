import { NotFoundError, ForbiddenError } from "@/lib/shared/errors"
import * as repo from "../repository"
import type { Role, UserWithRoles } from "../types"

export async function getUserWithRoles(userId: string): Promise<UserWithRoles> {
  const user = await repo.findUserWithRoles(userId)
  if (!user) throw new NotFoundError("User")
  return user
}

export async function assignRole(userId: string, role: Role): Promise<void> {
  const user = await repo.findUserById(userId)
  if (!user) throw new NotFoundError("User")
  await repo.assignRole(userId, role)
}

export async function requireRole(userId: string, role: Role): Promise<void> {
  const has = await repo.hasRole(userId, role)
  if (!has) throw new ForbiddenError(`Role '${role}' required`)
}

export async function isCreator(userId: string): Promise<boolean> {
  return repo.hasRole(userId, "creator")
}

export async function isAdmin(userId: string): Promise<boolean> {
  return repo.hasRole(userId, "admin")
}
