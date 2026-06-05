import { serve } from "inngest/next"
import { inngest } from "@/lib/jobs/inngest"
// Nanti import functions di sini setelah Assessment dan Certificate domain selesai
// import { scoringJob } from "@/lib/jobs/functions/scoring"
// import { certificateJob } from "@/lib/jobs/functions/certificate"

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    // scoringJob,
    // certificateJob,
  ],
})
