export interface GameState {
  playerY: number
  computerY: number
  ballX: number
  ballY: number
  ballVelX: number
  ballVelY: number
  playerScore: number
  computerScore: number
  gameStarted: boolean
  gameOver: boolean
  winner: string
}

export interface RateLimitState {
  remainingMatches: number
  rateLimited: boolean
  resetTime?: number
  userFingerprint?: string
}

export interface AIDecision {
  targetY: number
  speed: number
  jitter?: number
  ttlMs?: number
  reasoning: string
}

export interface AIModel {
  id: string
  name: string
}

export interface PredictedIntercept {
  y: number
  timeMs: number
}

export interface AIDecisionExtra {
  predictedInterceptYNorm?: number
  timeToInterceptMs?: number
  canReach?: boolean
  ballMovingTowardAI?: boolean
  rallyLength?: number
}
