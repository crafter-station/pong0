"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { TextShimmer } from "@/components/core/text-shimmer"
import { Heart, Github } from "lucide-react"
import { GameCanvas } from "@/components/game-canvas"
import { GameControls } from "@/components/game-controls"
import { useGameState } from "@/hooks/use-game-state"
import { useRateLimit } from "@/hooks/use-rate-limit"
import { useAIDecision } from "@/hooks/use-ai-decision"
import { predictIntercept, resetBall } from "@/utils/game-physics"
import { 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  PADDLE_HEIGHT, 
  PADDLE_SPEED, 
  BALL_SIZE,
  COURT_BOUNDS 
} from "@/constants/game"

export default function PongGame() {
  const mouseYRef = useRef<number>(CANVAS_HEIGHT / 2)
  const touchYRef = useRef<number>(CANVAS_HEIGHT / 2)
  const [isMobile, setIsMobile] = useState(false)
  const [selectedModel, setSelectedModel] = useState("openai/gpt-oss-20b")
  
  const {
    gameState,
    setGameState,
    animationRef,
    rallyLengthRef,
    lastInterceptNormRef,
    startGame: startGameState,
    stopGame,
    resetGame,
  } = useGameState()
  
  const {
    rateLimitState,
    rateLimitMessage,
    startMatch,
    completeMatch,
  } = useRateLimit()
  
  const {
    aiDecision,
    aiTargetYRef,
    getAIDecision,
    shouldRefreshAI,
    updateAICallTime,
  } = useAIDecision(selectedModel)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768 || "ontouchstart" in window)
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  const startGame = useCallback(async () => {
    const allowed = await startMatch()
    if (allowed) {
      startGameState()
    }
  }, [startMatch, startGameState])

  const updateGame = useCallback(() => {
    setGameState((prev) => {
      if (!prev.gameStarted || prev.gameOver) return prev

      let newState = { ...prev }

      const targetY = (isMobile ? touchYRef.current : mouseYRef.current) - PADDLE_HEIGHT / 2
      newState.playerY = Math.max(COURT_BOUNDS.PADDLE_TOP, Math.min(COURT_BOUNDS.PADDLE_BOTTOM, targetY))

      const physics = predictIntercept(newState.ballX, newState.ballY, newState.ballVelX, newState.ballVelY)
      const predictedInterceptYNorm = Math.max(0, Math.min(1, physics.y / CANVAS_HEIGHT))
      const ballMovingTowardAI = newState.ballVelX > 0
      const interceptDelta = Math.abs(predictedInterceptYNorm - lastInterceptNormRef.current)
      const significantChange = ballMovingTowardAI && interceptDelta > 0.03

      const currentSpeed = aiDecision?.speed ? aiDecision.speed * PADDLE_SPEED * 2 : PADDLE_SPEED
      const computerCenter = newState.computerY + PADDLE_HEIGHT / 2
      const desiredTargetY = ballMovingTowardAI ? aiTargetYRef.current : CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2
      const targetCenter = desiredTargetY + PADDLE_HEIGHT / 2

      if (Math.abs(computerCenter - targetCenter) > 5) {
        if (computerCenter < targetCenter) {
          newState.computerY = Math.min(COURT_BOUNDS.PADDLE_BOTTOM, newState.computerY + currentSpeed)
        } else {
          newState.computerY = Math.max(COURT_BOUNDS.PADDLE_TOP, newState.computerY - currentSpeed)
        }
      }

      newState.ballX += newState.ballVelX
      newState.ballY += newState.ballVelY

      let wallBounce = false
      let playerHit = false
      let aiHit = false
      let scoreReset = false

      if (newState.ballY <= 25 || newState.ballY >= CANVAS_HEIGHT - 25) {
        newState.ballVelY = -newState.ballVelY
        wallBounce = true
      }

      if (
        newState.ballX <= 35 + BALL_SIZE &&
        newState.ballY >= newState.playerY &&
        newState.ballY <= newState.playerY + PADDLE_HEIGHT
      ) {
        newState.ballVelX = Math.abs(newState.ballVelX)
        const relativeIntersectY = newState.playerY + PADDLE_HEIGHT / 2 - newState.ballY
        const normalizedRelativeIntersection = relativeIntersectY / (PADDLE_HEIGHT / 2)
        newState.ballVelY = normalizedRelativeIntersection * 4
        playerHit = true
        rallyLengthRef.current += 1
      }

      if (
        newState.ballX >= CANVAS_WIDTH - 35 - 10 - BALL_SIZE &&
        newState.ballY >= newState.computerY &&
        newState.ballY <= newState.computerY + PADDLE_HEIGHT
      ) {
        newState.ballVelX = -Math.abs(newState.ballVelX)
        const relativeIntersectY = newState.computerY + PADDLE_HEIGHT / 2 - newState.ballY
        const normalizedRelativeIntersection = relativeIntersectY / (PADDLE_HEIGHT / 2)
        newState.ballVelY = normalizedRelativeIntersection * 4
        aiHit = true
        rallyLengthRef.current += 1
      }

      if (newState.ballX < 20) {
        newState.computerScore++
        const ballReset = resetBall()
        newState = { ...newState, ...ballReset }
        scoreReset = true
        rallyLengthRef.current = 0
      } else if (newState.ballX > CANVAS_WIDTH - 20) {
        newState.playerScore++
        const ballReset = resetBall()
        newState = { ...newState, ...ballReset }
        scoreReset = true
        rallyLengthRef.current = 0
      }

      if (newState.playerScore >= 5) {
        newState.gameOver = true
        newState.winner = "Player"
        setTimeout(() => completeMatch(), 100)
      } else if (newState.computerScore >= 5) {
        newState.gameOver = true
        newState.winner = "AI Opponent"
        setTimeout(() => completeMatch(), 100)
      }

      if (shouldRefreshAI(wallBounce, playerHit, aiHit, scoreReset, significantChange)) {
        updateAICallTime()
        lastInterceptNormRef.current = predictedInterceptYNorm

        const maxSpeed = PADDLE_SPEED * 2
        const distancePx = Math.abs((predictedInterceptYNorm * CANVAS_HEIGHT) - (newState.computerY + PADDLE_HEIGHT / 2))
        const framesAvailable = physics.timeMs / 16
        const canReach = ballMovingTowardAI ? distancePx <= maxSpeed * framesAvailable : true

        getAIDecision(newState, {
          predictedInterceptYNorm,
          timeToInterceptMs: physics.timeMs,
          canReach,
          ballMovingTowardAI,
          rallyLength: rallyLengthRef.current,
        })
      }

      return newState
    })
  }, [isMobile, getAIDecision, aiDecision, completeMatch, shouldRefreshAI, updateAICallTime, aiTargetYRef, rallyLengthRef, lastInterceptNormRef, setGameState])

  const gameLoop = useCallback(() => {
    updateGame()
    animationRef.current = requestAnimationFrame(gameLoop)
  }, [updateGame, animationRef])

  useEffect(() => {
    if (gameState.gameStarted && !gameState.gameOver) {
      animationRef.current = requestAnimationFrame(gameLoop)
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [gameState.gameStarted, gameState.gameOver, gameLoop, animationRef])

  return (
    <div className="flex flex-col items-center space-y-4 sm:space-y-8 px-4 py-6">
      <div className="flex items-center justify-between w-full max-w-xs sm:max-w-sm">
        <div className="text-center">
          <p className="text-xs text-white/40 font-light uppercase tracking-widest mb-1">Player</p>
          <p className="text-3xl sm:text-4xl font-light text-white tabular-nums">{gameState.playerScore}</p>
        </div>
        <div className="w-px h-12 sm:h-16 bg-white/10"></div>
        <div className="text-center">
          <p className="text-xs text-white/40 font-light uppercase tracking-widest mb-1">AI Opponent</p>
          <p className="text-3xl sm:text-4xl font-light text-white tabular-nums">{gameState.computerScore}</p>
        </div>
      </div>

      <div className="h-12 sm:h-14 flex items-center justify-center max-w-sm sm:max-w-md w-full px-2 overflow-hidden">
        {aiDecision && gameState.gameStarted ? (
          <TextShimmer className="text-xs sm:text-xs font-light italic text-center px-2 sm:px-4 leading-tight truncate whitespace-nowrap max-w-full" duration={3} spread={1.5}>
            {`AI: ${aiDecision.reasoning}`}
          </TextShimmer>
        ) : gameState.gameStarted ? (
          <p className="text-xs text-white/30 font-light italic text-center truncate whitespace-nowrap max-w-full">AI is thinking...</p>
        ) : null}
      </div>

      <div className="w-full max-w-4xl">
        <GameCanvas
          gameState={gameState}
          isMobile={isMobile}
          mouseYRef={mouseYRef}
          touchYRef={touchYRef}
        />
      </div>

      <GameControls
        gameState={gameState}
        selectedModel={selectedModel}
        setSelectedModel={setSelectedModel}
        rateLimitState={rateLimitState}
        rateLimitMessage={rateLimitMessage}
        onStartGame={startGame}
        onStopGame={stopGame}
        onResetGame={resetGame}
      />

      <div className="flex flex-col items-center space-y-3">
        <p className="text-xs text-white/40 font-light text-center max-w-md leading-relaxed px-4">
          First to 5 points wins. Powered by  
          {" "}
          <a
            href="https://vercel.com/ai-gateway"
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-white/30 hover:decoration-white/60"
          >
            Vercel AI Gateway
          </a>
          
          {isMobile ? "Touch and drag to move your paddle." : " Use your mouse to move your paddle up and down."}
        </p>

        <div className="flex items-center justify-center space-x-4">
          <div className="flex items-center space-x-1">
            <span className="text-xs text-white/40 font-light">Made with</span>
            <Heart className="h-4 w-4 text-red-500 fill-red-500 animate-pulse" />
            <span className="text-xs text-white/40 font-light">in LatAm</span>
          </div>
          
          <a
            href="https://github.com/crafter-station/pong0"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1 text-white/40 hover:text-white/60 transition-colors duration-200"
          >
            <Github className="h-4 w-4" />
            <span className="text-xs font-light">Source</span>
          </a>
        </div>
      </div>
    </div>
  )
}