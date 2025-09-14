import { headers } from "next/headers"
import { generateUserFingerprint, checkRateLimit } from "@/lib/rate-limit"

export async function POST() {
  try {
    const headersList = await headers()
    const ip = headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || "unknown"
    const userAgent = headersList.get("user-agent") || "unknown"
    
    const userFingerprint = generateUserFingerprint(ip, userAgent)
    const rateLimitResult = checkRateLimit(userFingerprint)
    
    if (!rateLimitResult.allowed) {
      return Response.json(
        {
          allowed: false,
          message: "Rate limit exceeded. You can play 2 matches per day.",
          remainingMatches: 0,
          resetTime: rateLimitResult.resetTime,
        },
        { status: 429 }
      )
    }
    
    return Response.json({
      allowed: true,
      remainingMatches: rateLimitResult.remainingMatches,
      userFingerprint, // We'll use this to track match completion
    })
  } catch (error) {
    console.error("Start match error:", error)
    return Response.json(
      { allowed: false, message: "Internal server error" },
      { status: 500 }
    )
  }
}
