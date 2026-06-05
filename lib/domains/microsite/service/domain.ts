import { ConflictError, NotFoundError, ForbiddenError, InvariantError } from "@/lib/shared/errors"
import * as domainRepo from "../repository/domain"
import * as creatorRepo from "../repository"
import type { CustomDomain } from "../types"

// Domain yang tidak boleh didaftarkan
const BLOCKED_DOMAINS = ["toeflynk.com", "www.toeflynk.com", "localhost"]

function normalizeDomain(raw: string): string {
  return raw.toLowerCase().trim().replace(/^https?:\/\//, "").replace(/\/$/, "")
}

function isValidDomain(domain: string): boolean {
  // Simple domain validation — harus punya TLD, tidak boleh ada path
  return /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z]{2,})+$/.test(domain)
}

export async function addCustomDomain(
  creatorId: string,
  rawDomain: string,
  isWhiteLabel: boolean
): Promise<CustomDomain> {
  const domain = normalizeDomain(rawDomain)

  if (!isValidDomain(domain)) {
    throw new InvariantError("Format domain tidak valid")
  }

  if (BLOCKED_DOMAINS.includes(domain)) {
    throw new InvariantError("Domain ini tidak dapat didaftarkan")
  }

  // Cek apakah domain sudah dipakai creator lain
  const existing = await domainRepo.findDomainByValue(domain)
  if (existing) {
    throw new ConflictError("Domain sudah didaftarkan")
  }

  // Cek tier creator — white-label hanya untuk pro ke atas
  if (isWhiteLabel) {
    const creator = await creatorRepo.findCreatorById(creatorId)
    if (!creator) throw new NotFoundError("Creator")
    if (creator.tier === "free") {
      throw new ForbiddenError("White-label hanya tersedia untuk tier Pro dan Enterprise")
    }
  }

  return domainRepo.addCustomDomain({ creatorId, domain, isWhiteLabel })
}

export async function toggleWhiteLabel(
  domainId: string,
  creatorId: string,
  isWhiteLabel: boolean
): Promise<CustomDomain> {
  const domains = await domainRepo.findDomainsByCreator(creatorId)
  const target = domains.find((d) => d.id === domainId)

  if (!target) throw new NotFoundError("Domain")
  if (target.creatorId !== creatorId) throw new ForbiddenError("Akses ditolak")

  if (isWhiteLabel) {
    const creator = await creatorRepo.findCreatorById(creatorId)
    if (!creator) throw new NotFoundError("Creator")
    if (creator.tier === "free") {
      throw new ForbiddenError("White-label hanya tersedia untuk tier Pro dan Enterprise")
    }
  }

  return domainRepo.updateDomainWhiteLabel(domainId, isWhiteLabel)
}

export async function removeCustomDomain(
  domainId: string,
  creatorId: string
): Promise<void> {
  const domains = await domainRepo.findDomainsByCreator(creatorId)
  const target = domains.find((d) => d.id === domainId)
  if (!target) throw new NotFoundError("Domain")

  await domainRepo.deleteDomain(domainId, creatorId)
}

export async function getCreatorDomains(creatorId: string): Promise<CustomDomain[]> {
  return domainRepo.findDomainsByCreator(creatorId)
}

/**
 * Verifikasi domain — cek apakah CNAME creator sudah pointing ke toeflynk.com.
 * Di production, ini bisa pakai DNS lookup. Untuk sekarang kita flag manual.
 */
export async function verifyDomain(
  domainId: string,
  creatorId: string
): Promise<{ verified: boolean; message: string }> {
  const domains = await domainRepo.findDomainsByCreator(creatorId)
  const target = domains.find((d) => d.id === domainId)
  if (!target) throw new NotFoundError("Domain")

  // TODO: DNS CNAME lookup di production
  // Untuk sekarang, langsung mark verified untuk kemudahan testing
  await domainRepo.updateDomainVerified(domainId)

  return {
    verified: true,
    message: "Domain berhasil diverifikasi",
  }
}
