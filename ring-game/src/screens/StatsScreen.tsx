import { useProgressStore } from '../store/progressStore'
import { getTotalLevels } from '../game/levels'
import type { Difficulty } from '../types'

interface StatsScreenProps {
  onBack: () => void
}

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  tutorial: 'Alıştırma',
  easy:     'Kolay',
  medium:   'Orta',
  hard:     'Zor',
  expert:   'Uzman',
  master:   'Usta',
}

const DIFFICULTY_RANGES: Array<{ difficulty: Difficulty; start: number; end: number }> = [
  { difficulty: 'tutorial', start: 1,   end: 10  },
  { difficulty: 'easy',     start: 11,  end: 25  },
  { difficulty: 'medium',   start: 26,  end: 50  },
  { difficulty: 'hard',     start: 51,  end: 80  },
  { difficulty: 'expert',   start: 81,  end: 120 },
  { difficulty: 'master',   start: 121, end: 200 },
]

const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  tutorial: '#22c55e',
  easy:     '#10b981',
  medium:   '#06b6d4',
  hard:     '#3b82f6',
  expert:   '#a855f7',
  master:   '#ef4444',
}

interface StatCardProps {
  value: string | number
  label: string
  accent?: boolean
}

function StatCard({ value, label, accent }: StatCardProps) {
  return (
    <div
      className="flex flex-col items-center py-4 px-3 rounded-2xl"
      style={{
        background: accent ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.06)',
        border: accent ? '1px solid rgba(16,185,129,0.35)' : '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <span
        className="text-3xl font-black leading-none mb-1"
        style={{ color: accent ? '#34d399' : '#fff' }}
      >
        {value}
      </span>
      <span className="text-xs text-white/45 text-center leading-tight">{label}</span>
    </div>
  )
}

export function StatsScreen({ onBack }: StatsScreenProps) {
  const { levels, dailyStreak, bestStreak } = useProgressStore()
  const totalLevels = getTotalLevels()

  const completedEntries = Object.values(levels).filter(l => l.completed)
  const completedCount = completedEntries.length
  const totalStars = completedEntries.reduce((sum, l) => sum + l.stars, 0)
  const maxStars = completedCount * 3
  const starPercent = maxStars > 0 ? Math.round((totalStars / maxStars) * 100) : 0
  const avgStars = completedCount > 0
    ? (totalStars / completedCount).toFixed(1)
    : '—'

  const progressPercent = totalLevels > 0
    ? Math.round((completedCount / totalLevels) * 100)
    : 0

  // Most played difficulty: find the band with most completed levels
  const bandCompletions = DIFFICULTY_RANGES.map(band => {
    let completed = 0
    let stars = 0
    for (let id = band.start; id <= band.end; id++) {
      const lp = levels[id]
      if (lp?.completed) {
        completed++
        stars += lp.stars
      }
    }
    const total = band.end - band.start + 1
    return { ...band, completed, total, stars }
  })

  return (
    <div className="min-h-screen flex flex-col text-white relative overflow-hidden">

      {/* Background orbs */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.10) 0%, transparent 70%)', filter: 'blur(48px)' }} />
      <div className="absolute bottom-1/3 right-1/4 w-56 h-56 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.10) 0%, transparent 70%)', filter: 'blur(36px)' }} />

      {/* Top bar */}
      <div
        className="flex items-center px-5 py-4 gap-3"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
      >
        <button
          onClick={onBack}
          className="text-white/60 hover:text-white transition-colors text-2xl leading-none pr-1"
          aria-label="Geri"
        >
          ←
        </button>
        <h1 className="text-xl font-bold tracking-tight flex-1">İstatistikler</h1>
        <span className="text-2xl">📊</span>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-6">

        {/* 2×3 Stat Grid */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard value={completedCount} label="Tamamlanan Level" accent={completedCount > 0} />
          <StatCard value={totalStars} label="Toplam Yıldız" />
          <StatCard value={avgStars} label="Ortalama Yıldız" />
          <StatCard value={`%${starPercent}`} label="Yıldız Verimi" />
          <StatCard value={dailyStreak === 0 ? '—' : `${dailyStreak} 🔥`} label="Günlük Seri" accent={dailyStreak >= 3} />
          <StatCard value={bestStreak === 0 ? '—' : `${bestStreak} 🏆`} label="En İyi Seri" />
        </div>

        {/* Level progress bar */}
        <div
          className="rounded-2xl p-4"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div className="flex justify-between text-sm mb-3">
            <span className="font-semibold text-white/80">Seviye İlerlemesi</span>
            <span className="text-emerald-400 font-bold">{completedCount}/{totalLevels}</span>
          </div>
          <div className="w-full h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${progressPercent}%`,
                background: 'linear-gradient(90deg, #10b981, #06b6d4)',
                boxShadow: progressPercent > 0 ? '0 0 8px rgba(16,185,129,0.55)' : 'none',
              }}
            />
          </div>
          <p className="text-xs text-white/35 mt-2 text-right">%{progressPercent} tamamlandı</p>
        </div>

        {/* Difficulty breakdown */}
        <div
          className="rounded-2xl p-4"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <p className="font-semibold text-white/80 text-sm mb-4">Zorluk Dağılımı</p>
          <div className="flex flex-col gap-3">
            {bandCompletions.map(band => {
              const pct = band.total > 0 ? Math.round((band.completed / band.total) * 100) : 0
              const color = DIFFICULTY_COLORS[band.difficulty]
              return (
                <div key={band.difficulty}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-medium" style={{ color }}>
                      {DIFFICULTY_LABELS[band.difficulty]}
                    </span>
                    <span className="text-xs text-white/45">
                      {band.completed}/{band.total}
                      {band.completed > 0 && (
                        <span className="ml-1 text-yellow-400">
                          {'⭐'.repeat(Math.min(Math.round(band.stars / Math.max(band.completed, 1)), 3))}
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${pct}%`,
                        background: color,
                        opacity: 0.85,
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

      </div>
    </div>
  )
}
