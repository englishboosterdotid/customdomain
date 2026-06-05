/**
 * Midtrans Snap integration.
 * Docs: https://docs.midtrans.com/reference/snap-api
 */

const BASE_URL = process.env.MIDTRANS_IS_PRODUCTION === "true"
  ? "https://app.midtrans.com/snap/v1"
  : "https://app.sandbox.midtrans.com/snap/v1"

const SERVER_KEY = process.env.MIDTRANS_SERVER_KEY!

function getAuthHeader(): string {
  return "Basic " + Buffer.from(SERVER_KEY + ":").toString("base64")
}

export interface SnapTransactionParams {
  orderId: string
  amountIDR: number // dalam cents (IDR * 100), akan dibagi 100 saat kirim ke Midtrans
  buyerName: string
  buyerEmail: string
  itemName: string
  expiry?: {
    duration: number
    unit: "minute" | "hour" | "day"
  }
}

export interface SnapTransactionResult {
  token: string
  redirectUrl: string
}

export async function createSnapTransaction(
  params: SnapTransactionParams
): Promise<SnapTransactionResult> {
  // Midtrans menerima IDR dalam satuan asli (bukan cents)
  const amountIDR = Math.round(params.amountIDR / 100)

  const body = {
    transaction_details: {
      order_id: params.orderId,
      gross_amount: amountIDR,
    },
    customer_details: {
      first_name: params.buyerName,
      email: params.buyerEmail,
    },
    item_details: [
      {
        id: params.orderId,
        price: amountIDR,
        quantity: 1,
        name: params.itemName.slice(0, 50), // Midtrans max 50 chars
      },
    ],
    expiry: params.expiry ?? {
      duration: 24,
      unit: "hour",
    },
  }

  const res = await fetch(`${BASE_URL}/transactions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: getAuthHeader(),
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(
      `Midtrans error ${res.status}: ${JSON.stringify(err)}`
    )
  }

  const data = await res.json()
  return {
    token: data.token,
    redirectUrl: data.redirect_url,
  }
}

/**
 * Verifikasi signature dari Midtrans webhook notification.
 * SHA512(order_id + status_code + gross_amount + server_key)
 */
export async function verifyWebhookSignature(payload: {
  order_id: string
  status_code: string
  gross_amount: string
  signature_key: string
}): Promise<boolean> {
  const raw = `${payload.order_id}${payload.status_code}${payload.gross_amount}${SERVER_KEY}`

  const encoder = new TextEncoder()
  const data = encoder.encode(raw)
  const hashBuffer = await crypto.subtle.digest("SHA-512", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")

  return hashHex === payload.signature_key
}
