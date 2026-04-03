import { useState } from 'react'
import { useProgressStore } from '../store/progressStore'
import { getTotalLevels } from '../game/levels'
import { getMuted, setMuted } from '../hooks/useSound'
import { getDailyRecord } from '../game/dailyChallenge'
import { ThemePicker } from '../components/ThemePicker'

interface HomeScreenProps {
  onPlay: () => void
  onMap: () => void
  onDaily: () => void
  onStats: () => void
}

const LOGO_COLORS = [
  { id: 'red',    hex: '#EF4444' },
  { id: 'green',  hex: '#22C55E' },
  { id: 'blue',   hex: '#3B82F6' },
  { id: 'yellow', hex: '#EAB308' },
]

export function HomeScreen({ onPlay, onMap, onDaily, onStats }: HomeScreenProps) {
  const { levels } = useProgressStore()
  const [muted, setMutedState] = useState(getMuted())
  const dailyRecord = getDailyRecord()

  const completedCount = Object.values(levels).filter(l => l.completed).length
  const totalLevels = getTotalLevels()
  const progressPercent = Math.round((completedCount / totalLevels) * 100)

  function toggleMute() {
    const next = !muted
    setMuted(next)
    setMutedState(next)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-10 text-white relative overflow-hidden">

      {/* Decorative background orbs */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)', filter: 'blur(40px)' }} />
      <div className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.12) 0%, transparent 70%)', filter: 'blur(32px)' }} />

      {/* Mute toggle */}
      <button
        onClick={toggleMute}
        className="absolute top-5 right-5 text-2xl text-white/40 hover:text-white/70 transition-colors"
        aria-label={muted ? 'Sesi aç' : 'Sesi kapat'}
      >
        {muted ? '🔇' : '🔊'}
      </button>

      {/* Logo */}
      <div className="flex flex-col items-center gap-4 mb-10">
        {/* Animated rings */}
        <div className="flex gap-2 mb-1">
          {LOGO_COLORS.map((c, i) => (
            <div
              key={c.id}
              className="rounded-full border-[5px] border-white/20 shadow-lg"
              style={{
                width: 36,
                height: 36,
                background: `radial-gradient(circle at 35% 35%, ${c.hex}dd, ${c.hex})`,
                boxShadow: `0 4px 12px ${c.hex}55`,
                animation: `float 2.4s ease-in-out ${i * 0.2}s infinite alternate`,
              }}
            />
          ))}
        </div>

        <h1
          className="text-6xl font-black tracking-tight"
          style={{ textShadow: '0 2px 20px rgba(99,102,241,0.5)' }}
        >
          Halka
        </h1>
        <p className="text-white/50 text-base font-medium tracking-widest uppercase">
          Renkleri Sırala
        </p>
      </div>

      {/* Progress bar */}
      {completedCount > 0 && (
        <div className="mb-8 w-full max-w-xs">
          <div className="flex justify-between text-sm text-white/50 mb-2">
            <span>{completedCount} / {totalLevels} tamamlandı</span>
            <span className="text-emerald-400 font-semibold">%{progressPercent}</span>
          </div>
          <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${progressPercent}%`,
                background: 'linear-gradient(90deg, #10b981, #06b6d4)',
                boxShadow: '0 0 8px rgba(16,185,129,0.6)',
              }}
            />
          </div>
        </div>
      )}

      {/* CTA Buttons */}
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <button
          onClick={onPlay}
          className="relative w-full py-5 rounded-3xl font-bold text-xl active:scale-95 transition-all duration-150 overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #10b981, #06b6d4)',
            boxShadow: '0 8px 24px rgba(16,185,129,0.35), 0 2px 6px rgba(0,0,0,0.3)',
          }}
        >
          <span className="relative z-10">
            {completedCount === 0 ? '🎮  Oyna!' : '▶  Devam Et'}
          </span>
          {/* Shine sweep */}
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.12) 50%, transparent 60%)' }} />
        </button>

        <button
          onClick={onMap}
          className="w-full py-4 rounded-3xl font-semibold text-lg active:scale-95 transition-all duration-150"
          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
        >
          🗺  Level Haritası
        </button>

        <button
          onClick={onDaily}
          className="w-full py-4 rounded-3xl font-semibold text-lg active:scale-95 transition-all duration-150 relative"
          style={{
            background: 'rgba(168,85,247,0.15)',
            border: `1px solid ${dailyRecord?.completed ? 'rgba(52,211,153,0.5)' : 'rgba(168,85,247,0.4)'}`,
          }}
        >
          {dailyRecord?.completed
            ? `✅  Günlük Tamamlandı ${dailyRecord.stars}⭐`
            : '🌟  Günlük Bulmaca'}
        </button>

        <button
          onClick={onStats}
          className="w-full py-4 rounded-3xl font-semibold text-lg active:scale-95 transition-all duration-150"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }}
        >
          📊  İstatistikler
        </button>
      </div>

      {/* Theme picker */}
      <div className="mt-8">
        <ThemePicker />
      </div>

      {/* Footer */}
      <p className="absolute bottom-safe bottom-5 text-white/15 text-xs text-center">
        Reklamsız · Ücretsiz · Çocuklar için
      </p>

      <style>{`
        @keyframes float {
          from { transform: translateY(0px); }
          to   { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  )
}
