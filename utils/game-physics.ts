import { CANVAS_WIDTH, CANVAS_HEIGHT, PADDLE_WIDTH, BALL_SPEED } from "@/constants/game"
import { PredictedIntercept } from "@/types/game"

export const resetBall = () => ({
  ballX: CANVAS_WIDTH / 2,
  ballY: CANVAS_HEIGHT / 2,
  ballVelX: Math.random() > 0.5 ? BALL_SPEED : -BALL_SPEED,
  ballVelY: (Math.random() - 0.5) * BALL_SPEED,
})

export const predictIntercept = (
  ballX: number,
  ballY: number,
  velX: number,
  velY: number,
): PredictedIntercept => {
  const topY = 25
  const bottomY = CANVAS_HEIGHT - 25
  const targetX = CANVAS_WIDTH - 35 - PADDLE_WIDTH
  let x = ballX
  let y = ballY
  let vx = velX
  let vy = velY
  let timeFrames = 0
  
  for (let i = 0; i < 1000; i++) {
    if ((vx > 0 && x >= targetX) || (vx < 0 && x <= targetX)) break

    const dtToWall = vy > 0 ? (bottomY - y) / vy : (topY - y) / vy
    const xAtWall = x + vx * dtToWall
    const willHitBeforePaddle = vx > 0 ? xAtWall < targetX : xAtWall > targetX

    if (willHitBeforePaddle) {
      x = xAtWall
      y = vy > 0 ? bottomY : topY
      timeFrames += Math.abs(dtToWall)
      vy = -vy
    } else {
      const dtToPaddle = (targetX - x) / vx
      const yAtPaddle = y + vy * dtToPaddle
      timeFrames += Math.abs(dtToPaddle)
      return { y: yAtPaddle, timeMs: Math.max(0, timeFrames * 16) }
    }
  }
  return { y, timeMs: 0 }
}
