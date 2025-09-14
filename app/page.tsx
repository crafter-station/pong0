import PongGame from "@/components/pong-game"

export default function Home() {
  return (
    <main className="min-h-screen bg-black grid-background flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-light text-white mb-4 text-balance tracking-tight">Pong0</h1>
          <p className="text-white/60 text-lg font-light">Move your mouse to control the paddle</p>
        </div>
        <PongGame />
      </div>
    </main>
  )
}
