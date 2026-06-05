import { eq, and } from "drizzle-orm"
import { db } from "@/lib/db"
import { customDomains } from "@/lib/db/schema"
import type { CustomDomain } from "../types"

export async function findDomainsByCreator(creatorId: string): Promise<CustomDomain[]> {
  return db
    .select()
    .from(customDomains)
    .where(eq(customDomains.creatorId, creatorId)) as Promise<CustomDomain[]>
}

export async function findDomainByValue(domain: string): Promise<CustomDomain | null> {
  const result = await db
    .select()
    .from(customDomains)
    .where(eq(customDomains.domain, domain))
    .limit(1)
  return (result[0] as CustomDomain) ?? null
}

export async function addCustomDomain(data: {
  creatorId: string
  domain: string
  isWhiteLabel: boolean
}): Promise<CustomDomain> {
  const result = await db
    .insert(customDomains)
    .values(data)
    .returning()
  return result[0] as CustomDomain
}

export async function updateDomainWhiteLabel(
  id: string,
  isWhiteLabel: boolean
): Promise<CustomDomain> {
  const result = await db
    .update(customDomains)
    .set({ isWhiteLabel, updatedAt: new Date() })
    .where(eq(customDomains.id, id))
    .returning()
  return result[0] as CustomDomain
}

export async function updateDomainVerified(id: string): Promise<void> {
  await db
    .update(customDomains)
    .set({ isVerified: true, updatedAt: new Date() })
    .where(eq(customDomains.id, id))
}

export async function deleteDomain(id: string, creatorId: string): Promise<void> {
  await db
    .delete(customDomains)
    .where(and(eq(customDomains.id, id), eq(customDomains.creatorId, creatorId)))
}
