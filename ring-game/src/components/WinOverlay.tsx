import { useEffect, useState } from 'react'
import { useProgressStore } from '../store/progressStore'

interface WinOverlayProps {
  levelId: number
  stars: number
  moveCount: number
  optimalMoves: number
  onNext: () => void
  onMap: () => void
  onReplay: () => void
}

const CONFETTI_COLORS = ['#EF4444','#EAB308','#22C55E','#3B82F6','#A855F7','#F97316','#EC4899','#06B6D4']

// Pre-generate confetti data once so it's stable across re-renders
function makeConfetti(n: number) {
  return Array.from({ length: n }, (_, i) => ({
    id: i,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    left: `${(i * 3.4 + 1.7) % 100}%`,
    delay: `${(i * 0.067) % 2}s`,
    duration: `${2 + (i % 5) * 0.4}s`,
    size: 7 + (i % 6),
    rotate: i % 2 === 0,
  }))
}

const CONFETTI_PIECES = makeConfetti(36)

const STAR_MESSAGES: Record<number, string> = {
  1: 'İyi deneme!',
  2: 'Harika!',
  3: 'Mükemmel!',
}

export function WinOverlay({ levelId, stars, moveCount, optimalMoves, onNext, onMap, onReplay }: WinOverlayProps) {
  const [visible, setVisible] = useState(false)
  const [starsShown, setStarsShown] = useState(0)
  const [showStats, setShowStats] = useState(false)
  const { getLevelProgress } = useProgressStore()

  const prev = getLevelProgress(levelId)
  const isNewBest = !prev?.bestMoves || moveCount <= prev.bestMoves
  const efficiency = Math.round((optimalMoves / moveCount) * 100)

  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), 150)
    return () => clearTimeout(t1)
  }, [])

  useEffect(() => {
    if (!visible) return

    // Reveal stars one by one with 220ms gap
    let count = 0
    const id = setInterval(() => {
      count++
      setStarsShown(count)
      if (count >= 3) {
        clearInterval(id)
        setTimeout(() => setShowStats(true), 200)
      }
    }, 220)
    return () => clearInterval(id)
  }, [visible])

  return (
    <div
      className={[
        'fixed inset-0 z-50 flex flex-col items-center justify-center',
        'transition-all duration-500',
        visible ? 'opacity-100' : 'opacity-0 pointer-events-none',
      ].join(' ')}
      style={{ background: 'rgba(8,8,24,0.82)', backdropFilter: 'blur(12px)' }}
    >
      <Confetti pieces={CONFETTI_PIECES} />

      <div className="relative flex flex-col items-center gap-5 text-white text-center px-6 max-w-sm w-full">

        {/* Header */}
        <div
          className={`transition-all duration-500 delay-100 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}
        >
          <div className="text-5xl mb-2" style={{ filter: 'drop-shadow(0 0 16px rgba(250,204,21,0.6))' }}>🎉</div>
          <h2 className="text-3xl font-black tracking-tight">Tebrikler!</h2>
          <p className="text-white/50 text-sm mt-1">Level {levelId} tamamlandı</p>
        </div>

        {/* Stars row */}
        <div className="flex items-end gap-2">
          {[1, 2, 3].map(n => {
            const earned = n <= stars
            const shown = n <= starsShown
            return (
              <div
                key={n}
                className="transition-all duration-300"
                style={{
                  transform: shown
                    ? n === 2 ? 'scale(1.25) translateY(-4px)' : 'scale(1.05)'
                    : 'scale(0.6)',
                  opacity: shown ? (earned ? 1 : 0.2) : 0,
                  transitionDelay: `${(n - 1) * 220}ms`,
                  filter: shown && earned ? 'drop-shadow(0 0 8px rgba(250,204,21,0.8))' : 'none',
                }}
              >
                <span style={{ fontSize: n === 2 ? 56 : 44 }}>⭐</span>
              </div>
            )
          })}
        </div>

        {/* Star label */}
        <p
          className={`font-bold text-lg transition-all duration-400 ${starsShown >= 3 ? 'opacity-100' : 'opacity-0'}`}
          style={{ color: stars === 3 ? '#facc15' : stars === 2 ? '#a3e635' : '#94a3b8' }}
        >
          {STAR_MESSAGES[stars]}
        </p>

        {/* Stats */}
        <div
          className={`w-full grid grid-cols-3 gap-2 transition-all duration-500 ${showStats ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}
        >
          <StatBox label="Hamle" value={moveCount} highlight={isNewBest} badge={isNewBest ? '🏆 Rekör' : undefined} />
          <StatBox label="Optimal" value={optimalMoves} />
          <StatBox label="Verim" value={`%${efficiency}`} highlight={efficiency >= 80} />
        </div>

        {/* Action buttons */}
        <div
          className={`flex flex-col gap-2.5 w-full transition-all duration-500 delay-300 ${showStats ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}
        >
          <button
            onClick={onNext}
            className="w-full py-4 rounded-2xl font-bold text-lg active:scale-95 transition-all duration-150 relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #10b981, #06b6d4)',
              boxShadow: '0 6px 20px rgba(16,185,129,0.4)',
            }}
          >
            Sonraki Level →
          </button>
          <div className="flex gap-2.5">
            <button
              onClick={onReplay}
              className="flex-1 py-3 rounded-2xl font-semibold active:scale-95 transition-all duration-150"
              style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}
            >
              ↺ Tekrar
            </button>
            <button
              onClick={onMap}
              className="flex-1 py-3 rounded-2xl font-semibold active:scale-95 transition-all duration-150"
              style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}
            >
              🗺 Harita
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Stat box ──────────────────────────────────────────────────────────────────
interface StatBoxProps {
  label: string
  value: number | string
  highlight?: boolean
  badge?: string
}

function StatBox({ label, value, highlight, badge }: StatBoxProps) {
  return (
    <div
      className="flex flex-col items-center py-3 px-2 rounded-2xl relative"
      style={{
        background: highlight ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.06)',
        border: highlight ? '1px solid rgba(16,185,129,0.4)' : '1px solid rgba(255,255,255,0.08)',
      }}
    >
      {badge && (
        <span className="absolute -top-2 text-xs bg-yellow-400 text-black rounded-full px-1.5 font-bold whitespace-nowrap">
          {badge}
        </span>
      )}
      <span className={`text-2xl font-black ${highlight ? 'text-emerald-400' : 'text-white'}`}>{value}</span>
      <span className="text-xs text-white/40 mt-0.5">{label}</span>
    </div>
  )
}

// ── Confetti ──────────────────────────────────────────────────────────────────
interface ConfettiPiece {
  id: number
  color: string
  left: string
  delay: string
  duration: string
  size: number
  rotate: boolean
}

function Confetti({ pieces }: { pieces: ConfettiPiece[] }) {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      {pieces.map(p => (
        <div
          key={p.id}
          className="absolute top-0 animate-confetti-fall"
          style={{
            left: p.left,
            width: p.size,
            height: p.size,
            background: p.color,
            borderRadius: p.rotate ? '2px' : '50%',
            animationDelay: p.delay,
            animationDuration: p.duration,
            boxShadow: `0 0 4px ${p.color}88`,
          }}
        />
      ))}
    </div>
  )
}
