import { generateObject } from "ai"
import { z } from "zod"

const PaddleDecisionSchema = z.object({
  targetY: z
    .number()
    .min(0)
    .max(1)
    .describe("Target Y position for the paddle (0-1, where 0 is top and 1 is bottom)"),
  speed: z
    .number()
    .min(0)
    .max(1)
    .describe("Movement speed factor (0-1, where 1 is fastest)"),
  jitter: z
    .number()
    .min(0)
    .max(0.2)
    .default(0)
    .describe("Small randomness (0-0.2) to induce deception and avoid predictability"),
  ttlMs: z
    .number()
    .min(200)
    .max(3000)
    .default(1200)
    .describe("Time in ms this plan should remain valid, unless a new event occurs"),
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
      predictedInterceptYNorm,
      timeToInterceptMs,
      canReach,
      ballMovingTowardAI,
      rallyLength,
      scorePlayer,
      scoreAI,
      model = "openai/gpt-oss-20b",
    } = await request.json()

    const { object } = await generateObject({
      model: model,
      schema: PaddleDecisionSchema,
      prompt: `You are a pong AI opponent controlling a paddle in a game. Make a short-horizon, stable plan for paddle movement. Plans should only change on events (serve/reset, wall bounce, player/AI contact, or significant trajectory change).

Game State:
- Ball position: x=${ballX.toFixed(2)}, y=${ballY.toFixed(2)} (0-1 normalized)
- Ball velocity: vx=${ballVelX.toFixed(3)}, vy=${ballVelY.toFixed(3)}
- Current paddle Y: ${paddleY.toFixed(2)} (0-1 normalized)
- Canvas height: ${canvasHeight}px
 - Predicted intercept Y at AI: ${typeof predictedInterceptYNorm === "number" ? predictedInterceptYNorm.toFixed(3) : "n/a"}
 - Time to intercept (ms): ${typeof timeToInterceptMs === "number" ? timeToInterceptMs : "n/a"}
 - Can reach intercept at max speed: ${canReach === true ? "true" : canReach === false ? "false" : "n/a"}
 - Ball moving toward AI: ${ballMovingTowardAI ? "true" : "false"}
 - Rally length (hits so far): ${typeof rallyLength === "number" ? rallyLength : "n/a"}
 - Score: player=${typeof scorePlayer === "number" ? scorePlayer : "n/a"}, ai=${typeof scoreAI === "number" ? scoreAI : "n/a"}

Strategy considerations:
- If ball is moving toward you (ballVelX > 0), position to intercept
- If ball is moving away (ballVelX < 0), move to center court position
- Consider ball's vertical velocity to predict where it will be
- Use higher speed for urgent movements, lower for positioning
- Stay within court bounds (0.1 to 0.9 normalized Y)
 - Prefer stable targets; avoid unnecessary changes until next event
 - If canReach is false, pick the closest feasible target and set a moderate speed for recovery
 - Use small jitter (0-0.2) to add subtle unpredictability; keep it near 0 when stabilizing
 - ttlMs controls plan stability; 800-1500ms is typical unless timeToInterceptMs is very short

IMPORTANT: Respond with EXACTLY this JSON structure:
{
  "targetY": <number between 0 and 1>,
  "speed": <number between 0 and 1>,
  "jitter": <number between 0 and 0.2>,
  "ttlMs": <number between 200 and 3000>,
  "reasoning": "<brief explanation of your decision>"
}`,
    })

    return Response.json(object)
  } catch (error) {
    console.error("AI Paddle Error:", error)
    return Response.json({
      targetY: 0.5,
      speed: 0.4,
      jitter: 0,
      ttlMs: 1000,
      reasoning: "Fallback to center position due to error",
    })
  }
}
