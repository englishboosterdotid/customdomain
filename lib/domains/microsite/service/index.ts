import { NotFoundError, ConflictError, ForbiddenError } from "@/lib/shared/errors"
import * as repo from "../repository"
import { assignRole } from "@/lib/domains/identity/repository"
import type {
  Creator,
  TenantContext,
  RegisterCreatorInput,
  UpdateMicrositeInput,
} from "../types"

// Reserved usernames yang tidak boleh dipakai creator
const RESERVED_USERNAMES = [
  "admin", "dashboard", "api", "auth", "login", "register",
  "verify", "static", "assets", "www", "mail", "help",
  "support", "about", "pricing", "blog", "terms", "privacy",
]

const USERNAME_REGEX = /^[a-z0-9][a-z0-9-]{2,29}$/

export async function registerCreator(
  input: RegisterCreatorInput
): Promise<Creator> {
  const username = input.username.toLowerCase().trim()

  // Validasi format username
  if (!USERNAME_REGEX.test(username)) {
    throw new ConflictError(
      "Username harus 3-30 karakter, hanya huruf kecil, angka, dan tanda hubung"
    )
  }

  // Cek reserved usernames
  if (RESERVED_USERNAMES.includes(username)) {
    throw new ConflictError(`Username '${username}' tidak tersedia`)
  }

  // Cek ketersediaan
  const available = await repo.isUsernameAvailable(username)
  if (!available) {
    throw new ConflictError(`Username '${username}' sudah digunakan`)
  }

  // Buat creator
  const creator = await repo.createCreator({ ...input, username })

  // Assign role creator ke user
  await assignRole(input.userId, "creator")

  return creator
}

export async function updateMicrosite(
  creatorId: string,
  requestingUserId: string,
  input: UpdateMicrositeInput
): Promise<Creator> {
  const creator = await repo.findCreatorById(creatorId)
  if (!creator) throw new NotFoundError("Creator")

  // Pastikan yang update adalah pemiliknya
  if (creator.userId !== requestingUserId) {
    throw new ForbiddenError("Tidak dapat mengubah microsite orang lain")
  }

  return repo.updateCreator(creatorId, input)
}

/**
 * Resolve tenant context dari username (Mode 1: path-based).
 * Dipakai di microsite page dan middleware.
 */
export async function resolveTenantByUsername(
  username: string
): Promise<TenantContext | null> {
  const creator = await repo.findCreatorByUsername(username)
  if (!creator || !creator.isActive) return null

  return {
    creator,
    isWhiteLabel: false,
    mode: "path",
  }
}

/**
 * Resolve tenant context dari custom domain (Mode 2 & 3).
 * Dipakai di middleware untuk custom domain routing.
 */
export async function resolveTenantByDomain(
  domain: string
): Promise<TenantContext | null> {
  const result = await repo.findCreatorByDomain(domain)
  if (!result || !result.creator.isActive) return null

  return {
    creator: result.creator,
    isWhiteLabel: result.customDomain.isWhiteLabel,
    mode: "custom-domain",
  }
}

export async function getCreatorByUserId(userId: string): Promise<Creator | null> {
  return repo.findCreatorByUserId(userId)
}

export async function checkUsernameAvailability(username: string): Promise<{
  available: boolean
  reason?: string
}> {
  const lower = username.toLowerCase()

  if (!USERNAME_REGEX.test(lower)) {
    return { available: false, reason: "Format username tidak valid" }
  }

  if (RESERVED_USERNAMES.includes(lower)) {
    return { available: false, reason: "Username ini direservasi oleh platform" }
  }

  const available = await repo.isUsernameAvailable(lower)
  return { available }
}
