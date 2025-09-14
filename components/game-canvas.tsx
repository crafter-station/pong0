"use client"

import { useRef, useEffect, useCallback, MutableRefObject } from "react"
import { GameState } from "@/types/game"
import { 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  PADDLE_WIDTH, 
  PADDLE_HEIGHT, 
  BALL_SIZE 
} from "@/constants/game"

interface GameCanvasProps {
  gameState: GameState
  isMobile: boolean
  mouseYRef: MutableRefObject<number>
  touchYRef: MutableRefObject<number>
}

export const GameCanvas = ({ gameState, isMobile, mouseYRef, touchYRef }: GameCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.fillStyle = "#1a4d3a"
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    ctx.strokeStyle = "#ffffff"
    ctx.lineWidth = 2
    ctx.setLineDash([])

    ctx.strokeRect(20, 20, CANVAS_WIDTH - 40, CANVAS_HEIGHT - 40)

    ctx.beginPath()
    ctx.moveTo(CANVAS_WIDTH / 2, 20)
    ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT - 20)
    ctx.stroke()

    const serviceLineY1 = 20 + (CANVAS_HEIGHT - 40) * 0.25
    const serviceLineY2 = 20 + (CANVAS_HEIGHT - 40) * 0.75

    ctx.beginPath()
    ctx.moveTo(20, serviceLineY1)
    ctx.lineTo(CANVAS_WIDTH - 20, serviceLineY1)
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(20, serviceLineY2)
    ctx.lineTo(CANVAS_WIDTH - 20, serviceLineY2)
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(CANVAS_WIDTH / 2, serviceLineY1)
    ctx.lineTo(CANVAS_WIDTH / 2, serviceLineY2)
    ctx.stroke()

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

    ctx.strokeStyle = "rgba(255, 255, 255, 0.8)"
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(CANVAS_WIDTH / 2, 20)
    ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT - 20)
    ctx.stroke()

    ctx.fillStyle = "#ffffff"
    ctx.fillRect(CANVAS_WIDTH / 2 - 2, 15, 4, 10)
    ctx.fillRect(CANVAS_WIDTH / 2 - 2, CANVAS_HEIGHT - 25, 4, 10)

    if (gameState.gameStarted) {
      ctx.fillStyle = "#ffffff"
      ctx.shadowColor = "rgba(255, 255, 255, 0.3)"
      ctx.shadowBlur = 8

      ctx.fillRect(25, gameState.playerY, PADDLE_WIDTH, PADDLE_HEIGHT)
      ctx.fillRect(CANVAS_WIDTH - 35, gameState.computerY, PADDLE_WIDTH, PADDLE_HEIGHT)
      ctx.shadowBlur = 0

      ctx.fillStyle = "#ffff00"
      ctx.shadowColor = "rgba(255, 255, 0, 0.4)"
      ctx.shadowBlur = 6
      ctx.beginPath()
      ctx.arc(gameState.ballX, gameState.ballY, BALL_SIZE / 2, 0, Math.PI * 2)
      ctx.fill()

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

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const scaleY = CANVAS_HEIGHT / rect.height
      if (mouseYRef.current !== undefined) {
        mouseYRef.current = (e.clientY - rect.top) * scaleY
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault()
      const rect = canvas.getBoundingClientRect()
      const scaleY = CANVAS_HEIGHT / rect.height
      const touch = e.touches[0]
      if (touchYRef.current !== undefined) {
        touchYRef.current = (touch.clientY - rect.top) * scaleY
      }
    }

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault()
      const rect = canvas.getBoundingClientRect()
      const scaleY = CANVAS_HEIGHT / rect.height
      const touch = e.touches[0]
      if (touchYRef.current !== undefined) {
        touchYRef.current = (touch.clientY - rect.top) * scaleY
      }
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
  }, [draw, mouseYRef, touchYRef])

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      className="border border-white/10 rounded-lg w-full h-auto touch-none select-none"
      style={{
        aspectRatio: `${CANVAS_WIDTH}/${CANVAS_HEIGHT}`,
        maxHeight: isMobile ? "40vh" : "50vh",
        cursor: isMobile ? "default" : "none",
      }}
    />
  )
}
