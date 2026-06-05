import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { creators, customDomains } from "@/lib/db/schema"
import type { Creator, CustomDomain, RegisterCreatorInput, UpdateMicrositeInput } from "../types"

// Helper untuk memastikan primaryColor selalu string
function ensureCreatorType(creator: any): Creator {
  return {
    ...creator,
    primaryColor: creator.primaryColor ?? "#6366f1",
  }
}

export async function findCreatorByUsername(username: string): Promise<Creator | null> {
  const result = await db
    .select()
    .from(creators)
    .where(eq(creators.username, username))
    .limit(1)

  if (!result[0]) return null
  return ensureCreatorType(result[0])
}

export async function findCreatorById(id: string): Promise<Creator | null> {
  const result = await db
    .select()
    .from(creators)
    .where(eq(creators.id, id))
    .limit(1)

  if (!result[0]) return null
  return ensureCreatorType(result[0])
}

export async function findCreatorByUserId(userId: string): Promise<Creator | null> {
  const result = await db
    .select()
    .from(creators)
    .where(eq(creators.userId, userId))
    .limit(1)

  if (!result[0]) return null
  return ensureCreatorType(result[0])
}

export async function findCreatorByDomain(domain: string): Promise<{
  creator: Creator
  customDomain: CustomDomain
} | null> {
  const result = await db
    .select({
      creator: creators,
      customDomain: customDomains,
    })
    .from(customDomains)
    .innerJoin(creators, eq(creators.id, customDomains.creatorId))
    .where(eq(customDomains.domain, domain))
    .limit(1)

  if (!result[0]) return null
  return {
    creator: ensureCreatorType(result[0].creator),
    customDomain: result[0].customDomain,
  }
}

export async function isUsernameAvailable(username: string): Promise<boolean> {
  const result = await db
    .select({ id: creators.id })
    .from(creators)
    .where(eq(creators.username, username))
    .limit(1)

  return result.length === 0
}

export async function createCreator(input: RegisterCreatorInput): Promise<Creator> {
  const result = await db
    .insert(creators)
    .values({
      userId: input.userId,
      username: input.username.toLowerCase(),
      displayName: input.displayName,
    })
    .returning()

  return ensureCreatorType(result[0])
}

export async function updateCreator(
  id: string,
  input: UpdateMicrositeInput
): Promise<Creator> {
  const result = await db
    .update(creators)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(creators.id, id))
    .returning()

  return ensureCreatorType(result[0])
}
