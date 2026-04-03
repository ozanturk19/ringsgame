import { useEffect, useState } from 'react'
import { ANIM } from '../constants/animations'

interface WinOverlayProps {
  levelId: number
  stars: number
  moveCount: number
  onNext: () => void
  onMap: () => void
  onReplay: () => void
}

export function WinOverlay({ levelId, stars, moveCount, onNext, onMap, onReplay }: WinOverlayProps) {
  const [visible, setVisible] = useState(false)
  const [starsShown, setStarsShown] = useState(0)

  useEffect(() => {
    // Slight delay so the game board settles first
    const t1 = setTimeout(() => setVisible(true), 200)
    return () => clearTimeout(t1)
  }, [])

  useEffect(() => {
    if (!visible) return
    let count = 0
    const interval = setInterval(() => {
      count++
      setStarsShown(Math.min(count, stars))
      if (count >= stars) clearInterval(interval)
    }, ANIM.STAR_FILL / stars)
    return () => clearInterval(interval)
  }, [visible, stars])

  return (
    <div
      className={[
        'fixed inset-0 z-50 flex flex-col items-center justify-center',
        'transition-opacity duration-500',
        visible ? 'opacity-100' : 'opacity-0 pointer-events-none',
      ].join(' ')}
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
    >
      <Confetti />

      <div className="flex flex-col items-center gap-6 text-white text-center px-8">
        <div className="text-6xl animate-bounce">🎉</div>

        <h2 className="text-3xl font-bold">Tebrikler!</h2>
        <p className="text-white/70 text-lg">
          Level {levelId} — {moveCount} hamle
        </p>

        {/* Stars */}
        <div className="flex gap-3">
          {[1, 2, 3].map(n => (
            <span
              key={n}
              className={[
                'text-5xl transition-all duration-300',
                starsShown >= n ? 'opacity-100 scale-110' : 'opacity-20 scale-90',
              ].join(' ')}
              style={{ transitionDelay: `${(n - 1) * 200}ms` }}
            >
              ⭐
            </span>
          ))}
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-3 w-full max-w-xs mt-2">
          <button
            onClick={onNext}
            className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 active:scale-95 rounded-2xl font-bold text-lg transition-all"
          >
            Sonraki Level →
          </button>
          <div className="flex gap-3">
            <button
              onClick={onReplay}
              className="flex-1 py-3 bg-white/15 hover:bg-white/25 active:scale-95 rounded-2xl font-medium transition-all"
            >
              ↺ Tekrar
            </button>
            <button
              onClick={onMap}
              className="flex-1 py-3 bg-white/15 hover:bg-white/25 active:scale-95 rounded-2xl font-medium transition-all"
            >
              🗺 Harita
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Simple CSS confetti
function Confetti() {
  const pieces = Array.from({ length: 30 }, (_, i) => i)
  const colors = ['#EF4444', '#EAB308', '#22C55E', '#3B82F6', '#A855F7', '#F97316', '#EC4899', '#06B6D4']

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {pieces.map(i => {
        const color = colors[i % colors.length]
        const left = `${Math.random() * 100}%`
        const delay = `${Math.random() * 2}s`
        const duration = `${2 + Math.random() * 2}s`
        const size = 8 + Math.floor(Math.random() * 8)

        return (
          <div
            key={i}
            className="absolute top-0 animate-confetti-fall rounded-sm"
            style={{
              left,
              width: size,
              height: size,
              background: color,
              animationDelay: delay,
              animationDuration: duration,
            }}
          />
        )
      })}
    </div>
  )
}
