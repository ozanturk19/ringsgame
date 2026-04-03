interface BottomBarProps {
  canUndo: boolean
  onUndo: () => void
  onReset: () => void
  onHint: () => void
  hintActive: boolean
}

export function BottomBar({ canUndo, onUndo, onReset, onHint, hintActive }: BottomBarProps) {
  return (
    <div className="flex items-center justify-around px-6 py-4">
      <ActionButton
        label="Geri Al"
        icon="↩"
        onClick={onUndo}
        disabled={!canUndo}
      />
      <ActionButton
        label="Yeniden"
        icon="↺"
        onClick={onReset}
      />
      <ActionButton
        label="İpucu"
        icon="💡"
        onClick={onHint}
        active={hintActive}
      />
    </div>
  )
}

interface ActionButtonProps {
  label: string
  icon: string
  onClick: () => void
  disabled?: boolean
  active?: boolean
}

function ActionButton({ label, icon, onClick, disabled = false, active = false }: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={[
        'flex flex-col items-center gap-1 px-5 py-3 rounded-2xl transition-all duration-150 select-none',
        'text-white font-medium',
        disabled
          ? 'opacity-30 cursor-not-allowed'
          : active
          ? 'bg-yellow-400/20 border border-yellow-400/50 scale-105'
          : 'bg-white/10 hover:bg-white/20 active:scale-95',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-label={label}
    >
      <span className="text-xl">{icon}</span>
      <span className="text-xs">{label}</span>
    </button>
  )
}
