import { useState, useCallback } from "react"
import { RateLimitState } from "@/types/game"

export const useRateLimit = () => {
  const [rateLimitState, setRateLimitState] = useState<RateLimitState>({
    remainingMatches: 2,
    rateLimited: false,
  })
  const [rateLimitMessage, setRateLimitMessage] = useState<string>("")

  const startMatch = useCallback(async () => {
    try {
      setRateLimitMessage("")
      
      const response = await fetch("/api/start-match", {
        method: "POST",
      })

      const result = await response.json()

      if (!result.allowed) {
        setRateLimitState({
          remainingMatches: 0,
          rateLimited: true,
          resetTime: result.resetTime,
        })
        
        if (result.resetTime) {
          const resetDate = new Date(result.resetTime)
          const timeUntilReset = resetDate.getTime() - Date.now()
          const hoursUntilReset = Math.ceil(timeUntilReset / (1000 * 60 * 60))
          setRateLimitMessage(`Rate limit reached. Try again in ${hoursUntilReset} hour${hoursUntilReset !== 1 ? 's' : ''}.`)
        } else {
          setRateLimitMessage(result.message || "Rate limit reached.")
        }
        return false
      }

      setRateLimitState({
        remainingMatches: result.remainingMatches,
        rateLimited: false,
        userFingerprint: result.userFingerprint,
      })

      return true
    } catch (error) {
      console.error("Failed to start match:", error)
      setRateLimitMessage("Failed to start match. Please try again.")
      return false
    }
  }, [])

  const completeMatch = useCallback(async () => {
    if (!rateLimitState.userFingerprint) return

    try {
      const response = await fetch("/api/complete-match", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userFingerprint: rateLimitState.userFingerprint,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        setRateLimitState(prev => ({
          ...prev,
          remainingMatches: result.remainingMatches,
          rateLimited: result.remainingMatches <= 0,
        }))
      }
    } catch (error) {
      console.error("Failed to complete match:", error)
    }
  }, [rateLimitState.userFingerprint])

  return {
    rateLimitState,
    rateLimitMessage,
    startMatch,
    completeMatch,
  }
}
