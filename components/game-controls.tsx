"use client"

import { Button } from "@/components/ui/button"
import { GameState, RateLimitState } from "@/types/game"
import { AI_MODELS } from "@/constants/game"

interface GameControlsProps {
  gameState: GameState
  selectedModel: string
  setSelectedModel: (model: string) => void
  rateLimitState: RateLimitState
  rateLimitMessage: string
  onStartGame: () => void
  onStopGame: () => void
  onResetGame: () => void
}

export const GameControls = ({
  gameState,
  selectedModel,
  setSelectedModel,
  rateLimitState,
  rateLimitMessage,
  onStartGame,
  onStopGame,
  onResetGame,
}: GameControlsProps) => {
  return (
    <div className="flex flex-col items-center space-y-3">
      <div className="h-8 flex items-center justify-center">
        {rateLimitMessage ? (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-light px-4 py-2 rounded-md text-center max-w-sm">
            {rateLimitMessage}
          </div>
        ) : !rateLimitState.rateLimited && rateLimitState.remainingMatches < 2 ? (
          <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs font-light px-4 py-2 rounded-md text-center">
            {rateLimitState.remainingMatches} match{rateLimitState.remainingMatches !== 1 ? 'es' : ''} remaining today
          </div>
        ) : null}
      </div>
      
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
          onClick={onStartGame}
          disabled={rateLimitState.rateLimited}
          className="bg-white hover:bg-white/90 text-black font-light px-6 sm:px-8 py-3 rounded-md transition-all duration-200 hover:scale-105 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {gameState.gameStarted ? "New Game" : "Start Game"}
        </Button>
        <Button
          onClick={gameState.gameStarted ? onStopGame : onResetGame}
          className="bg-white/10 hover:bg-white/20 text-white font-light px-6 sm:px-8 py-3 rounded-md transition-all duration-200 hover:scale-105 text-sm sm:text-base"
        >
          {gameState.gameStarted ? "Stop" : "Reset"}
        </Button>
      </div>
    </div>
  )
}
