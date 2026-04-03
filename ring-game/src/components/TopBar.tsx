interface TopBarProps {
  levelId: number
  moveCount: number
  onBack: () => void
}

export function TopBar({ levelId, moveCount, onBack }: TopBarProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 text-white">
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-white/70 hover:text-white transition-colors text-sm"
        aria-label="Back to level map"
      >
        ← Geri
      </button>

      <div className="flex flex-col items-center">
        <span className="text-xs text-white/50 font-medium uppercase tracking-widest">Level</span>
        <span className="text-2xl font-bold leading-tight">{levelId}</span>
      </div>

      <div className="flex flex-col items-center">
        <span className="text-xs text-white/50 font-medium uppercase tracking-widest">Hamle</span>
        <span className="text-2xl font-bold leading-tight">{moveCount}</span>
      </div>
    </div>
  )
}
