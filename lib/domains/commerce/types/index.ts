export interface CatalogProduct {
  id: string
  type: "toefl_simulation" | "digital_product" | "resell"
  name: string
  description: string | null
  isActive: boolean
  metadata: Record<string, unknown> | null
  createdAt: Date
  updatedAt: Date
}

export interface Offering {
  id: string
  creatorId: string
  catalogProductId: string | null
  name: string
  description: string | null
  priceIDR: number // dalam cents (IDR * 100)
  isActive: boolean
  bonusText: string | null
  metadata: Record<string, unknown> | null
  createdAt: Date
  updatedAt: Date
}

export interface Order {
  id: string
  offeringId: string
  creatorId: string
  buyerEmail: string
  buyerName: string
  buyerUserId: string | null
  amountIDR: number
  platformFeeIDR: number
  creatorEarningIDR: number
  status: "pending" | "paid" | "failed" | "expired" | "refunded"
  idempotencyKey: string
  midtransOrderId: string | null
  midtransPaymentType: string | null
  paidAt: Date | null
  expiredAt: Date | null
  createdAt: Date
}

export interface CreateOrderInput {
  offeringId: string
  buyerEmail: string
  buyerName: string
  buyerUserId?: string
}

export interface CreateOfferingInput {
  creatorId: string
  catalogProductId?: string
  name: string
  description?: string
  priceIDR: number
  bonusText?: string
}

export interface MidtransChargeResult {
  orderId: string
  token: string        // Snap token untuk frontend
  redirectUrl: string  // Fallback redirect URL
}
