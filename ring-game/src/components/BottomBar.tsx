interface BottomBarProps {
  canUndo: boolean
  onUndo: () => void
  onReset: () => void
  onHint: () => void
  hintActive: boolean
  canSkip: boolean
  onSkip: () => void
}

export function BottomBar({ canUndo, onUndo, onReset, onHint, hintActive, canSkip, onSkip }: BottomBarProps) {
  return (
    <div className="flex items-center justify-around px-4 py-3 safe-bottom"
      style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
    >
      <ActionButton label="Geri Al" icon="↩" onClick={onUndo} disabled={!canUndo} />
      <ActionButton label="Yeniden" icon="↺" onClick={onReset} />
      <ActionButton label="İpucu" icon="💡" onClick={onHint} active={hintActive} />
      {canSkip && (
        <ActionButton label="Atla" icon="⏭" onClick={onSkip} accent />
      )}
    </div>
  )
}

interface ActionButtonProps {
  label: string
  icon: string
  onClick: () => void
  disabled?: boolean
  active?: boolean
  accent?: boolean
}

function ActionButton({ label, icon, onClick, disabled = false, active = false, accent = false }: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={[
        'flex flex-col items-center gap-0.5 px-4 py-2.5 rounded-2xl',
        'font-medium transition-all duration-150 select-none',
        'text-white',
        disabled
          ? 'opacity-25 cursor-not-allowed'
          : accent
          ? 'bg-purple-500/25 border border-purple-400/40 hover:bg-purple-500/35 active:scale-95'
          : active
          ? 'bg-yellow-400/20 border border-yellow-400/40 active:scale-95'
          : 'hover:bg-white/10 active:scale-95',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-label={label}
    >
      <span className="text-xl leading-none">{icon}</span>
      <span className="text-[11px] text-white/60">{label}</span>
    </button>
  )
}
