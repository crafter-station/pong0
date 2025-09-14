interface UserRateLimit {
  matchesPlayed: number
  firstMatchTime: number
  lastMatchTime: number
}

// In-memory store for rate limiting
// In production, use Redis or a database
const rateLimitStore = new Map<string, UserRateLimit>()

// Rate limit: 2 matches per user per day
const MAX_MATCHES_PER_USER = 10
const RATE_LIMIT_WINDOW = 24 * 60 * 60 * 1000 // 24 hours in milliseconds

export function generateUserFingerprint(ip: string, userAgent: string): string {
  // Simple fingerprinting - in production, use a more sophisticated approach
  const combined = `${ip}-${userAgent}`
  return btoa(combined).slice(0, 16)
}

export function checkRateLimit(userFingerprint: string): {
  allowed: boolean
  remainingMatches: number
  resetTime?: number
} {
  const now = Date.now()
  const userLimit = rateLimitStore.get(userFingerprint)

  if (!userLimit) {
    // First time user
    return {
      allowed: true,
      remainingMatches: MAX_MATCHES_PER_USER - 1,
    }
  }

  // Check if rate limit window has expired
  if (now - userLimit.firstMatchTime > RATE_LIMIT_WINDOW) {
    // Reset the rate limit
    rateLimitStore.delete(userFingerprint)
    return {
      allowed: true,
      remainingMatches: MAX_MATCHES_PER_USER - 1,
    }
  }

  // Check if user has exceeded the limit
  if (userLimit.matchesPlayed >= MAX_MATCHES_PER_USER) {
    const resetTime = userLimit.firstMatchTime + RATE_LIMIT_WINDOW
    return {
      allowed: false,
      remainingMatches: 0,
      resetTime,
    }
  }

  return {
    allowed: true,
    remainingMatches: MAX_MATCHES_PER_USER - userLimit.matchesPlayed - 1,
  }
}

export function incrementMatchCount(userFingerprint: string): void {
  const now = Date.now()
  const userLimit = rateLimitStore.get(userFingerprint)

  if (!userLimit) {
    rateLimitStore.set(userFingerprint, {
      matchesPlayed: 1,
      firstMatchTime: now,
      lastMatchTime: now,
    })
  } else {
    rateLimitStore.set(userFingerprint, {
      ...userLimit,
      matchesPlayed: userLimit.matchesPlayed + 1,
      lastMatchTime: now,
    })
  }
}

export function getRemainingMatches(userFingerprint: string): number {
  const result = checkRateLimit(userFingerprint)
  return result.remainingMatches
}

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now()
  const fingerprintsToDelete: string[] = []

  rateLimitStore.forEach((limit, fingerprint) => {
    if (now - limit.firstMatchTime > RATE_LIMIT_WINDOW) {
      fingerprintsToDelete.push(fingerprint)
    }
  })

  fingerprintsToDelete.forEach(fingerprint => {
    rateLimitStore.delete(fingerprint)
  })
}, 60 * 60 * 1000) // Clean up every hour
