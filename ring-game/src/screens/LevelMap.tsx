import { useProgressStore } from '../store/progressStore'
import { LEVELS } from '../game/levels'
import type { Difficulty } from '../types'

interface LevelMapProps {
  onSelectLevel: (id: number) => void
  onBack: () => void
}

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  tutorial: '🟢 Başlangıç',
  easy: '🟡 Kolay',
  medium: '🟠 Orta',
  hard: '🔴 Zor',
  expert: '🟣 Uzman',
  master: '⚫ Efsane',
}

const DIFFICULTY_ORDER: Difficulty[] = ['tutorial', 'easy', 'medium', 'hard', 'expert', 'master']

export function LevelMap({ onSelectLevel, onBack }: LevelMapProps) {
  const { levels: progress, isLevelUnlocked } = useProgressStore()

  const grouped = DIFFICULTY_ORDER.map(diff => ({
    difficulty: diff,
    levels: LEVELS.filter(l => l.difficulty === diff),
  }))

  return (
    <div className="min-h-screen text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-4 px-4 py-3" style={{ background: 'rgba(15,15,35,0.95)', backdropFilter: 'blur(8px)' }}>
        <button
          onClick={onBack}
          className="text-white/70 hover:text-white transition-colors"
          aria-label="Back"
        >
          ← Geri
        </button>
        <h2 className="text-xl font-bold">Level Haritası</h2>
      </div>

      <div className="px-4 py-6 space-y-8">
        {grouped.map(({ difficulty, levels }) => {
          const completedInGroup = levels.filter(l => progress[l.id]?.completed).length
          return (
            <section key={difficulty}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold">{DIFFICULTY_LABELS[difficulty]}</h3>
                <span className="text-sm text-white/50">
                  {completedInGroup}/{levels.length}
                </span>
              </div>

              <div className="grid grid-cols-5 gap-2">
                {levels.map(level => {
                  const prog = progress[level.id]
                  const unlocked = isLevelUnlocked(level.id)
                  const stars = prog?.stars ?? 0

                  return (
                    <LevelCell
                      key={level.id}
                      levelId={level.id}
                      stars={stars}
                      completed={prog?.completed ?? false}
                      unlocked={unlocked}
                      onSelect={onSelectLevel}
                    />
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}

interface LevelCellProps {
  levelId: number
  stars: number
  completed: boolean
  unlocked: boolean
  onSelect: (id: number) => void
}

function LevelCell({ levelId, stars, completed, unlocked, onSelect }: LevelCellProps) {
  return (
    <button
      onClick={() => unlocked && onSelect(levelId)}
      disabled={!unlocked}
      className={[
        'flex flex-col items-center justify-center aspect-square rounded-2xl transition-all duration-150',
        'text-sm font-bold',
        unlocked
          ? completed
            ? 'bg-emerald-500/20 border border-emerald-400/50 hover:bg-emerald-500/30 active:scale-95'
            : 'bg-white/10 border border-white/20 hover:bg-white/20 active:scale-95'
          : 'bg-white/5 border border-white/5 cursor-not-allowed opacity-40',
      ].join(' ')}
    >
      {unlocked ? (
        <>
          <span>{levelId}</span>
          {stars > 0 && (
            <div className="flex mt-1">
              {[1, 2, 3].map(n => (
                <span key={n} className={`text-xs ${n <= stars ? 'opacity-100' : 'opacity-20'}`}>
                  ⭐
                </span>
              ))}
            </div>
          )}
        </>
      ) : (
        <span className="text-base">🔒</span>
      )}
    </button>
  )
}
