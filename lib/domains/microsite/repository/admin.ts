import { eq, desc, ilike } from "drizzle-orm"
import { db } from "@/lib/db"
import { creators } from "@/lib/db/schema"

export async function findAllCreators(search?: string) {
  const query = db.select().from(creators)
  if (search) {
    return query.where(ilike(creators.username, `%${search}%`))
  }
  return query.orderBy(desc(creators.createdAt))
}

export async function setCreatorTier(
  id: string,
  tier: "free" | "pro" | "enterprise"
) {
  const result = await db
    .update(creators)
    .set({ tier, updatedAt: new Date() })
    .where(eq(creators.id, id))
    .returning()
  return result[0]
}

export async function setCreatorActive(id: string, isActive: boolean) {
  const result = await db
    .update(creators)
    .set({ isActive, updatedAt: new Date() })
    .where(eq(creators.id, id))
    .returning()
  return result[0]
}
