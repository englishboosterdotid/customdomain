/**
 * Buat API error response yang konsisten.
 */
export function apiError(message: string, status: number, code?: string) {
  return Response.json({ error: message, ...(code && { code }) }, { status })
}

/**
 * Format harga IDR dari cents ke display string.
 * 150000 (IDR cents) → "Rp 1.500"
 * Note: kita store IDR * 100 untuk presisi
 */
export function formatIDR(amountCents: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amountCents / 100)
}

/**
 * Hitung platform fee berdasarkan creator tier.
 * Return dalam bentuk cents (IDR * 100).
 */
export function calculatePlatformFee(
  amountCents: number,
  tier: "free" | "pro" | "enterprise"
): { platformFee: number; creatorEarning: number } {
  const feeRate = tier === "free" ? 0.05 : tier === "pro" ? 0.03 : 0.02
  const platformFee = Math.round(amountCents * feeRate)
  const creatorEarning = amountCents - platformFee
  return { platformFee, creatorEarning }
}

/**
 * Slug-safe string untuk URL.
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()
}
