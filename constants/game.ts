import { AIModel } from "@/types/game"

export const CANVAS_WIDTH = 800
export const CANVAS_HEIGHT = 400
export const PADDLE_WIDTH = 10
export const PADDLE_HEIGHT = 80
export const BALL_SIZE = 10
export const PADDLE_SPEED = 6
export const BALL_SPEED = 4

export const AI_MODELS: AIModel[] = [
  

    { id: "openai/gpt-4o-mini", name: "GPT 4o Mini" },
  { id: "openai/gpt-4.1-nano", name: "GPT 4.1 Nano" },
  { id: "openai/gpt-5-nano", name: "GPT 5 Nano" },
  { id: "openai/gpt-oss-20b", name: "GPT OSS 20B" },
  { id: "openai/gpt-oss-120b", name: "GPT OSS 120B" },

  { id: "google/gemini-2.5-flash-lite", name: "Gemini 2.5 Flash Lite" },
  { id: "google/gemini-2.0-flash", name: "Gemini 2.0 Flash" },

  { id: "xai/grok-3-mini", name: "Grok 3 Mini" },
  { id: "alibaba/qwen-3-32b", name: "Qwen 3 32B" },
  { id: "meta/llama-4-scout", name: "Llama 4 Scout" },
  
  { id: "mistral/codestral", name: "Codestral" },

  { id: "deepseek/deepseek-v3", name: "DeepSeek V3" },
]

export const COURT_BOUNDS = {
  TOP: 20,
  BOTTOM: CANVAS_HEIGHT - 20,
  LEFT: 20,
  RIGHT: CANVAS_WIDTH - 20,
  PADDLE_TOP: 20,
  PADDLE_BOTTOM: CANVAS_HEIGHT - 20 - PADDLE_HEIGHT,
}
