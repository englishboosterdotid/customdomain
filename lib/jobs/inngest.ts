import { Inngest } from "inngest"

export const inngest = new Inngest({
  id: "toeflynk",
  name: "Toeflynk",
})

// Event type definitions
export type ToeflynkEvents = {
  "order/paid": {
    data: {
      orderId: string
      buyerUserId: string | null
      buyerEmail: string
      creatorId: string
    }
  }
  "assessment/submitted": {
    data: {
      attemptId: string
      userId: string
    }
  }
  "certificate/generate": {
    data: {
      attemptId: string
      userId: string
    }
  }
}
