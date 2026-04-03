import { useProgressStore } from '../store/progressStore'
import { getTotalLevels } from '../game/levels'

interface HomeScreenProps {
  onPlay: () => void
  onMap: () => void
}

export function HomeScreen({ onPlay, onMap }: HomeScreenProps) {
  const { levels } = useProgressStore()

  const completedCount = Object.values(levels).filter(l => l.completed).length
  const totalLevels = getTotalLevels()
  const progressPercent = Math.round((completedCount / totalLevels) * 100)

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 text-white">
      {/* Logo / Title */}
      <div className="flex flex-col items-center gap-3 mb-12">
        <div className="flex gap-2 mb-2">
          {['red', 'green', 'blue', 'yellow'].map((c, i) => (
            <div
              key={c}
              className="w-8 h-8 rounded-full border-4 border-white/30"
              style={{
                background: {
                  red: '#EF4444',
                  green: '#22C55E',
                  blue: '#3B82F6',
                  yellow: '#EAB308',
                }[c],
                animationDelay: `${i * 150}ms`,
              }}
            />
          ))}
        </div>
        <h1 className="text-5xl font-black tracking-tight">Halka</h1>
        <p className="text-white/50 text-lg font-medium">Renkleri Sırala!</p>
      </div>

      {/* Progress pill */}
      {completedCount > 0 && (
        <div className="mb-8 flex flex-col items-center gap-2 w-full max-w-xs">
          <div className="flex justify-between w-full text-sm text-white/60">
            <span>{completedCount} / {totalLevels} tamamlandı</span>
            <span>%{progressPercent}</span>
          </div>
          <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full transition-all duration-700"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Main CTA */}
      <div className="flex flex-col gap-4 w-full max-w-xs">
        <button
          onClick={onPlay}
          className="w-full py-5 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 active:scale-95 rounded-3xl font-bold text-xl shadow-lg shadow-emerald-900/40 transition-all duration-150"
        >
          {completedCount === 0 ? '🎮 Oyna!' : '▶ Devam Et'}
        </button>

        <button
          onClick={onMap}
          className="w-full py-4 bg-white/10 hover:bg-white/20 active:scale-95 rounded-3xl font-semibold text-lg transition-all duration-150"
        >
          🗺 Level Haritası
        </button>
      </div>

      {/* Footer */}
      <p className="absolute bottom-6 text-white/20 text-xs">
        Reklamsız · Ücretsiz · Çocuklar için
      </p>
    </div>
  )
}
