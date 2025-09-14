import { useState, useRef, useCallback } from "react"
import { AIDecision, GameState, AIDecisionExtra } from "@/types/game"
import { CANVAS_WIDTH, CANVAS_HEIGHT, BALL_SPEED } from "@/constants/game"

export const useAIDecision = (selectedModel: string) => {
  const [aiDecision, setAiDecision] = useState<AIDecision | null>(null)
  const lastAiCallRef = useRef<number>(0)
  const aiTargetYRef = useRef<number>(CANVAS_HEIGHT / 2)
  const aiPlanExpiresAtRef = useRef<number>(0)
  const planJitterOffsetRef = useRef<number>(0)

  const getAIDecision = useCallback(
    async (gameState: GameState, extra: AIDecisionExtra = {}) => {
      try {
        const response = await fetch("/api/ai-paddle", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ballX: gameState.ballX / CANVAS_WIDTH,
            ballY: gameState.ballY / CANVAS_HEIGHT,
            ballVelX: gameState.ballVelX / BALL_SPEED,
            ballVelY: gameState.ballVelY / BALL_SPEED,
            paddleY: gameState.computerY / CANVAS_HEIGHT,
            canvasHeight: CANVAS_HEIGHT,
            predictedInterceptYNorm: extra.predictedInterceptYNorm,
            timeToInterceptMs: extra.timeToInterceptMs,
            canReach: extra.canReach,
            ballMovingTowardAI: extra.ballMovingTowardAI,
            rallyLength: extra.rallyLength,
            scorePlayer: gameState.playerScore,
            scoreAI: gameState.computerScore,
            model: selectedModel,
          }),
        })

        if (response.ok) {
          const decision: AIDecision = await response.json()
          setAiDecision(decision)
          const jitterNorm = Math.max(0, Math.min(0.2, decision.jitter ?? 0))
          const jitterOffsetPx = (Math.random() * 2 - 1) * jitterNorm * CANVAS_HEIGHT
          planJitterOffsetRef.current = jitterOffsetPx
          aiTargetYRef.current = decision.targetY * CANVAS_HEIGHT + jitterOffsetPx - 40
          aiPlanExpiresAtRef.current = Date.now() + (decision.ttlMs ?? 1200)
          console.log("[v0] AI Decision:", decision.reasoning)
        }
      } catch (error) {
        console.error("[v0] AI Decision Error:", error)
      }
    },
    [selectedModel],
  )

  const shouldRefreshAI = useCallback((
    wallBounce: boolean,
    playerHit: boolean,
    aiHit: boolean,
    scoreReset: boolean,
    significantChange: boolean
  ) => {
    const now = Date.now()
    const planExpired = now > aiPlanExpiresAtRef.current
    return (wallBounce || playerHit || aiHit || scoreReset || significantChange || planExpired) && 
           now - lastAiCallRef.current > 150
  }, [])

  const updateAICallTime = useCallback(() => {
    lastAiCallRef.current = Date.now()
  }, [])

  return {
    aiDecision,
    aiTargetYRef,
    getAIDecision,
    shouldRefreshAI,
    updateAICallTime,
  }
}
