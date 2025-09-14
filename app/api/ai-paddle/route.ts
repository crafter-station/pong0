import { generateObject } from "ai"
import { groq } from "@ai-sdk/groq"
import { z } from "zod"

const PaddleDecisionSchema = z.object({
  targetY: z.number().describe("Target Y position for the paddle (0-1, where 0 is top and 1 is bottom)"),
  speed: z.number().min(0).max(1).describe("Movement speed (0-1, where 1 is fastest)"),
  reasoning: z.string().describe("Brief explanation of the decision"),
})

export async function POST(request: Request) {
  try {
    const {
      ballX,
      ballY,
      ballVelX,
      ballVelY,
      paddleY,
      canvasHeight,
      model = "openai/gpt-oss-20b",
    } = await request.json()

    const { object } = await generateObject({
      model: groq(model),
      schema: PaddleDecisionSchema,
      prompt: `You are controlling a tennis paddle in a game. Make a strategic decision for paddle movement.

Game State:
- Ball position: x=${ballX.toFixed(2)}, y=${ballY.toFixed(2)} (0-1 normalized)
- Ball velocity: vx=${ballVelX.toFixed(3)}, vy=${ballVelY.toFixed(3)}
- Current paddle Y: ${paddleY.toFixed(2)} (0-1 normalized)
- Canvas height: ${canvasHeight}px

Strategy considerations:
- If ball is moving toward you (ballVelX > 0), position to intercept
- If ball is moving away (ballVelX < 0), move to center court position
- Consider ball's vertical velocity to predict where it will be
- Use higher speed for urgent movements, lower for positioning
- Stay within court bounds (0.1 to 0.9 normalized Y)

Respond with your paddle movement decision.`,
    })

    return Response.json(object)
  } catch (error) {
    console.error("AI Paddle Error:", error)
    return Response.json({
      targetY: 0.5,
      speed: 0.5,
      reasoning: "Fallback to center position due to error",
    })
  }
}
