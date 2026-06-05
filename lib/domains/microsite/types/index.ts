export type CreatorTier = "free" | "pro" | "enterprise"

export interface Creator {
  id: string
  userId: string
  username: string
  tier: CreatorTier
  displayName: string
  bio: string | null
  logoUrl: string | null
  coverUrl: string | null
  primaryColor: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface CustomDomain {
  id: string
  creatorId: string
  domain: string
  isWhiteLabel: boolean
  isVerified: boolean
  sslProvisioned: boolean
}

export interface TenantContext {
  creator: Creator
  isWhiteLabel: boolean
  // Mode bagaimana tenant di-resolve
  mode: "path" | "custom-domain"
}

export interface RegisterCreatorInput {
  userId: string
  username: string
  displayName: string
}

export interface UpdateMicrositeInput {
  displayName?: string
  bio?: string
  logoUrl?: string
  coverUrl?: string
  primaryColor?: string
}
