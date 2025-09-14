import { incrementMatchCount, getRemainingMatches } from "@/lib/rate-limit"

export async function POST(request: Request) {
  try {
    const { userFingerprint } = await request.json()
    
    if (!userFingerprint) {
      return Response.json(
        { success: false, message: "User fingerprint required" },
        { status: 400 }
      )
    }
    
    // Increment the match count for this user
    incrementMatchCount(userFingerprint)
    
    const remainingMatches = getRemainingMatches(userFingerprint)
    
    return Response.json({
      success: true,
      remainingMatches,
    })
  } catch (error) {
    console.error("Complete match error:", error)
    return Response.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    )
  }
}
