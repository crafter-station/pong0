"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { TextShimmer } from "@/components/core/text-shimmer"

interface GameState {
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

interface AIDecision {
  targetY: number
  speed: number
  reasoning: string
}

const CANVAS_WIDTH = 800
const CANVAS_HEIGHT = 400
const PADDLE_WIDTH = 10
const PADDLE_HEIGHT = 80
const BALL_SIZE = 10
const PADDLE_SPEED = 6
const BALL_SPEED = 4

const AI_MODELS = [
  { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B" },
  { id: "llama-3.1-8b-instant", name: "Llama 3.1 8B" },
  { id: "gemma2-9b-it", name: "Gemma2 9B" },
  { id: "groq/compound", name: "Groq Compound" },
  { id: "deepseek-r1-distill-llama-70b", name: "DeepSeek R1" },
  { id: "openai/gpt-oss-20b", name: "GPT OSS 20B" },
]

export default function TennisGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const mouseYRef = useRef<number>(CANVAS_HEIGHT / 2)
  const touchYRef = useRef<number>(CANVAS_HEIGHT / 2)
  const [isMobile, setIsMobile] = useState(false)
  const [aiDecision, setAiDecision] = useState<AIDecision | null>(null)
  const lastAiCallRef = useRef<number>(0)
  const aiTargetYRef = useRef<number>(CANVAS_HEIGHT / 2)
  const [selectedModel, setSelectedModel] = useState("openai/gpt-oss-20b")

  const [gameState, setGameState] = useState<GameState>({
    playerY: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
    computerY: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
    ballX: CANVAS_WIDTH / 2,
    ballY: CANVAS_HEIGHT / 2,
    ballVelX: BALL_SPEED,
    ballVelY: BALL_SPEED,
    playerScore: 0,
    computerScore: 0,
    gameStarted: false,
    gameOver: false,
    winner: "",
  })

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768 || "ontouchstart" in window)
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  const resetBall = useCallback(() => {
    return {
      ballX: CANVAS_WIDTH / 2,
      ballY: CANVAS_HEIGHT / 2,
      ballVelX: Math.random() > 0.5 ? BALL_SPEED : -BALL_SPEED,
      ballVelY: (Math.random() - 0.5) * BALL_SPEED,
    }
  }, [])

  const startGame = useCallback(() => {
    setGameState((prev) => ({
      ...prev,
      ...resetBall(),
      gameStarted: true,
      gameOver: false,
      playerScore: 0,
      computerScore: 0,
      winner: "",
    }))
  }, [resetBall])

  const getAIDecision = useCallback(
    async (gameState: GameState) => {
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
            model: selectedModel, // Include selected model
          }),
        })

        if (response.ok) {
          const decision: AIDecision = await response.json()
          setAiDecision(decision)
          aiTargetYRef.current = decision.targetY * CANVAS_HEIGHT - PADDLE_HEIGHT / 2
          console.log("[v0] AI Decision:", decision.reasoning)
        }
      } catch (error) {
        console.error("[v0] AI Decision Error:", error)
      }
    },
    [selectedModel],
  )

  const updateGame = useCallback(() => {
    setGameState((prev) => {
      if (!prev.gameStarted || prev.gameOver) return prev

      let newState = { ...prev }

      // Player paddle control (unchanged)
      const targetY = (isMobile ? touchYRef.current : mouseYRef.current) - PADDLE_HEIGHT / 2
      const courtTop = 20
      const courtBottom = CANVAS_HEIGHT - 20 - PADDLE_HEIGHT
      newState.playerY = Math.max(courtTop, Math.min(courtBottom, targetY))

      const now = Date.now()
      if (now - lastAiCallRef.current > 500) {
        // Call AI every 500ms
        lastAiCallRef.current = now
        getAIDecision(newState)
      }

      // Move computer paddle toward AI target with AI-determined speed
      const currentSpeed = aiDecision?.speed ? aiDecision.speed * PADDLE_SPEED * 2 : PADDLE_SPEED
      const computerCenter = newState.computerY + PADDLE_HEIGHT / 2
      const targetCenter = aiTargetYRef.current + PADDLE_HEIGHT / 2

      if (Math.abs(computerCenter - targetCenter) > 5) {
        if (computerCenter < targetCenter) {
          newState.computerY = Math.min(courtBottom, newState.computerY + currentSpeed)
        } else {
          newState.computerY = Math.max(courtTop, newState.computerY - currentSpeed)
        }
      }

      newState.ballX += newState.ballVelX
      newState.ballY += newState.ballVelY

      if (newState.ballY <= 25 || newState.ballY >= CANVAS_HEIGHT - 25) {
        newState.ballVelY = -newState.ballVelY
      }

      if (
        newState.ballX <= 35 + BALL_SIZE &&
        newState.ballY >= newState.playerY &&
        newState.ballY <= newState.playerY + PADDLE_HEIGHT
      ) {
        newState.ballVelX = Math.abs(newState.ballVelX)
        const relativeIntersectY = newState.playerY + PADDLE_HEIGHT / 2 - newState.ballY
        const normalizedRelativeIntersection = relativeIntersectY / (PADDLE_HEIGHT / 2)
        newState.ballVelY = normalizedRelativeIntersection * BALL_SPEED
      }

      if (
        newState.ballX >= CANVAS_WIDTH - 35 - PADDLE_WIDTH - BALL_SIZE &&
        newState.ballY >= newState.computerY &&
        newState.ballY <= newState.computerY + PADDLE_HEIGHT
      ) {
        newState.ballVelX = -Math.abs(newState.ballVelX)
        const relativeIntersectY = newState.computerY + PADDLE_HEIGHT / 2 - newState.ballY
        const normalizedRelativeIntersection = relativeIntersectY / (PADDLE_HEIGHT / 2)
        newState.ballVelY = normalizedRelativeIntersection * BALL_SPEED
      }

      if (newState.ballX < 20) {
        newState.computerScore++
        const ballReset = resetBall()
        newState = { ...newState, ...ballReset }
      } else if (newState.ballX > CANVAS_WIDTH - 20) {
        newState.playerScore++
        const ballReset = resetBall()
        newState = { ...newState, ...ballReset }
      }

      if (newState.playerScore >= 5) {
        newState.gameOver = true
        newState.winner = "Player"
      } else if (newState.computerScore >= 5) {
        newState.gameOver = true
        newState.winner = "AI Opponent"
      }

      return newState
    })
  }, [resetBall, isMobile, getAIDecision, aiDecision])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Court background - dark green tennis court color
    ctx.fillStyle = "#1a4d3a"
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    // Court lines - white tennis court lines
    ctx.strokeStyle = "#ffffff"
    ctx.lineWidth = 2
    ctx.setLineDash([])

    // Outer court boundary
    ctx.strokeRect(20, 20, CANVAS_WIDTH - 40, CANVAS_HEIGHT - 40)

    // Center net line
    ctx.beginPath()
    ctx.moveTo(CANVAS_WIDTH / 2, 20)
    ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT - 20)
    ctx.stroke()

    // Service lines
    const serviceLineY1 = 20 + (CANVAS_HEIGHT - 40) * 0.25
    const serviceLineY2 = 20 + (CANVAS_HEIGHT - 40) * 0.75

    // Service lines (horizontal)
    ctx.beginPath()
    ctx.moveTo(20, serviceLineY1)
    ctx.lineTo(CANVAS_WIDTH - 20, serviceLineY1)
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(20, serviceLineY2)
    ctx.lineTo(CANVAS_WIDTH - 20, serviceLineY2)
    ctx.stroke()

    // Center service line (vertical in service boxes)
    ctx.beginPath()
    ctx.moveTo(CANVAS_WIDTH / 2, serviceLineY1)
    ctx.lineTo(CANVAS_WIDTH / 2, serviceLineY2)
    ctx.stroke()

    // Singles sidelines (inner court boundaries)
    const singlesSidelineLeft = 60
    const singlesSidelineRight = CANVAS_WIDTH - 60

    ctx.beginPath()
    ctx.moveTo(singlesSidelineLeft, 20)
    ctx.lineTo(singlesSidelineLeft, CANVAS_HEIGHT - 20)
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(singlesSidelineRight, 20)
    ctx.lineTo(singlesSidelineRight, CANVAS_HEIGHT - 20)
    ctx.stroke()

    // Net representation - subtle white line with shadow
    ctx.strokeStyle = "rgba(255, 255, 255, 0.8)"
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(CANVAS_WIDTH / 2, 20)
    ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT - 20)
    ctx.stroke()

    // Net posts
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(CANVAS_WIDTH / 2 - 2, 15, 4, 10)
    ctx.fillRect(CANVAS_WIDTH / 2 - 2, CANVAS_HEIGHT - 25, 4, 10)

    if (gameState.gameStarted) {
      ctx.fillStyle = "#ffffff"
      ctx.shadowColor = "rgba(255, 255, 255, 0.3)"
      ctx.shadowBlur = 8

      // Player paddle (left side, respecting court boundary)
      ctx.fillRect(25, gameState.playerY, PADDLE_WIDTH, PADDLE_HEIGHT)

      // Computer paddle (right side, respecting court boundary)
      ctx.fillRect(CANVAS_WIDTH - 35, gameState.computerY, PADDLE_WIDTH, PADDLE_HEIGHT)
      ctx.shadowBlur = 0

      // Tennis ball with more realistic appearance
      ctx.fillStyle = "#ffff00" // Tennis ball yellow
      ctx.shadowColor = "rgba(255, 255, 0, 0.4)"
      ctx.shadowBlur = 6
      ctx.beginPath()
      ctx.arc(gameState.ballX, gameState.ballY, BALL_SIZE / 2, 0, Math.PI * 2)
      ctx.fill()

      // Tennis ball seam lines
      ctx.strokeStyle = "#ffffff"
      ctx.lineWidth = 1
      ctx.shadowBlur = 0
      ctx.beginPath()
      ctx.arc(gameState.ballX, gameState.ballY, BALL_SIZE / 2 - 1, Math.PI * 0.2, Math.PI * 0.8)
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(gameState.ballX, gameState.ballY, BALL_SIZE / 2 - 1, Math.PI * 1.2, Math.PI * 1.8)
      ctx.stroke()
    }

    ctx.fillStyle = "rgba(255, 255, 255, 0.8)"
    ctx.font = "300 28px system-ui, -apple-system, sans-serif"
    ctx.textAlign = "center"
    ctx.fillText(`${gameState.playerScore}`, CANVAS_WIDTH / 4, 45)
    ctx.fillText(`${gameState.computerScore}`, (3 * CANVAS_WIDTH) / 4, 45)

    if (gameState.gameOver) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.9)"
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

      ctx.fillStyle = "#ffffff"
      ctx.font = "300 24px system-ui, -apple-system, sans-serif"
      ctx.textAlign = "center"
      ctx.fillText(`${gameState.winner} wins`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2)

      ctx.fillStyle = "rgba(255, 255, 255, 0.5)"
      ctx.font = "300 12px system-ui, -apple-system, sans-serif"
      ctx.fillText('Click "New Game" to play again', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30)
    }
  }, [gameState])

  const gameLoop = useCallback(() => {
    updateGame()
    draw()
    animationRef.current = requestAnimationFrame(gameLoop)
  }, [updateGame, draw])

  useEffect(() => {
    if (gameState.gameStarted && !gameState.gameOver) {
      animationRef.current = requestAnimationFrame(gameLoop)
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [gameState.gameStarted, gameState.gameOver, gameLoop])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const scaleY = CANVAS_HEIGHT / rect.height
      mouseYRef.current = (e.clientY - rect.top) * scaleY
    }

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault()
      const rect = canvas.getBoundingClientRect()
      const scaleY = CANVAS_HEIGHT / rect.height
      const touch = e.touches[0]
      touchYRef.current = (touch.clientY - rect.top) * scaleY
    }

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault()
      const rect = canvas.getBoundingClientRect()
      const scaleY = CANVAS_HEIGHT / rect.height
      const touch = e.touches[0]
      touchYRef.current = (touch.clientY - rect.top) * scaleY
    }

    canvas.addEventListener("mousemove", handleMouseMove)
    canvas.addEventListener("touchmove", handleTouchMove, { passive: false })
    canvas.addEventListener("touchstart", handleTouchStart, { passive: false })

    draw()

    return () => {
      canvas.removeEventListener("mousemove", handleMouseMove)
      canvas.removeEventListener("touchmove", handleTouchMove)
      canvas.removeEventListener("touchstart", handleTouchStart)
    }
  }, [draw])

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

      <div className="h-12 flex items-center justify-center max-w-md w-full">
        {aiDecision && gameState.gameStarted ? (
          <TextShimmer className="text-xs font-light italic text-center px-4" duration={3} spread={1.5}>
            AI: {aiDecision.reasoning}
          </TextShimmer>
        ) : gameState.gameStarted ? (
          <p className="text-xs text-white/30 font-light italic text-center">AI is thinking...</p>
        ) : null}
      </div>

      <div className="w-full max-w-4xl">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="border border-white/10 rounded-lg w-full h-auto touch-none select-none"
          style={{
            aspectRatio: `${CANVAS_WIDTH}/${CANVAS_HEIGHT}`,
            maxHeight: "50vh",
            cursor: isMobile ? "default" : "none",
          }}
        />
      </div>

      <div className="flex flex-col items-center space-y-3">
        <div className="flex items-center space-x-3">
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            disabled={gameState.gameStarted && !gameState.gameOver}
            className="bg-black/50 border border-white/10 text-white/80 text-xs font-light px-3 py-2 rounded-md focus:outline-none focus:border-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {AI_MODELS.map((model) => (
              <option key={model.id} value={model.id} className="bg-black text-white">
                {model.name}
              </option>
            ))}
          </select>
          <Button
            onClick={startGame}
            className="bg-white hover:bg-white/90 text-black font-light px-6 sm:px-8 py-3 rounded-md transition-all duration-200 hover:scale-105 text-sm sm:text-base"
          >
            {gameState.gameStarted ? "New Game" : "Start Game"}
          </Button>
        </div>
      </div>

      <p className="text-xs text-white/40 font-light text-center max-w-md leading-relaxed px-4">
        First to 5 points wins. Play against an AI powered by Groq LLM.{" "}
        {isMobile ? "Touch and drag to move your paddle." : "Use your mouse to move your paddle up and down."}
      </p>
    </div>
  )
}
