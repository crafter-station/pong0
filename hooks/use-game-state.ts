import { useState, useRef, useCallback } from "react"
import { GameState } from "@/types/game"
import { CANVAS_WIDTH, CANVAS_HEIGHT, PADDLE_HEIGHT, BALL_SPEED } from "@/constants/game"
import { resetBall } from "@/utils/game-physics"

export const useGameState = () => {
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

  const animationRef = useRef<number>()
  const rallyLengthRef = useRef<number>(0)
  const lastInterceptNormRef = useRef<number>(0.5)

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
  }, [])

  const stopGame = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }
    setGameState((prev) => ({ ...prev, gameStarted: false }))
  }, [])

  const resetGame = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }
    rallyLengthRef.current = 0
    setGameState((prev) => ({
      ...prev,
      playerY: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
      computerY: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
      ballX: CANVAS_WIDTH / 2,
      ballY: CANVAS_HEIGHT / 2,
      ballVelX: 0,
      ballVelY: 0,
      playerScore: 0,
      computerScore: 0,
      gameStarted: false,
      gameOver: false,
      winner: "",
    }))
  }, [])

  return {
    gameState,
    setGameState,
    animationRef,
    rallyLengthRef,
    lastInterceptNormRef,
    startGame,
    stopGame,
    resetGame,
  }
}
