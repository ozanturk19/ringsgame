import { Ring } from './Ring'
import type { Tube as TubeType } from '../types'

interface TubeProps {
  tube: TubeType
  index: number
  isSelected: boolean
  isShaking: boolean
  isHintFrom: boolean
  isHintTo: boolean
  isComplete: boolean
  celebrating?: boolean
  isDropTarget?: boolean
  onClick: (index: number) => void
  entranceDelay?: number
  size?: 'sm' | 'md' | 'lg'
  tubeWidth?: number    // dynamic override (responsive)
  slotHeight?: number   // dynamic override (responsive)
  newestRingIndex?: number
}

const SLOT_H: Record<'sm' | 'md' | 'lg', number> = { sm: 28, md: 36, lg: 44 }
const TUBE_W: Record<'sm' | 'md' | 'lg', number> = { sm: 56, md: 72, lg: 88 }

export function Tube({
  tube,
  index,
  isSelected,
  isShaking,
  isHintFrom,
  isHintTo,
  isComplete,
  celebrating = false,
  isDropTarget = false,
  onClick,
  entranceDelay = 0,
  size = 'md',
  tubeWidth,
  slotHeight,
  newestRingIndex,
}: TubeProps) {
  const tubeW = tubeWidth ?? TUBE_W[size]
  const slotH = slotHeight ?? SLOT_H[size]
  const tubeH = tube.capacity * slotH + 20
  // Map dynamic width back to Ring size
  const ringSize: 'sm' | 'md' | 'lg' = tubeW >= 80 ? 'lg' : tubeW >= 64 ? 'md' : 'sm'

  const borderColor = isSelected
    ? 'rgba(255,255,255,0.9)'
    : isHintFrom
    ? 'rgba(253,224,71,0.9)'
    : isHintTo
    ? 'rgba(74,222,128,0.9)'
    : isComplete
    ? 'rgba(52,211,153,0.7)'
    : tube.locked
    ? 'rgba(100,100,100,0.4)'
    : 'rgba(255,255,255,0.15)'

  const glowColor = isSelected
    ? 'rgba(255,255,255,0.35)'
    : isHintFrom
    ? 'rgba(253,224,71,0.45)'
    : isHintTo
    ? 'rgba(74,222,128,0.45)'
    : isComplete
    ? 'rgba(52,211,153,0.35)'
    : 'transparent'

  return (
    <div
      className={[
        'relative flex flex-col-reverse items-center cursor-pointer select-none will-change-transform',
        'animate-tube-enter',
        isShaking ? 'animate-shake' : '',
        tube.locked ? 'cursor-not-allowed' : '',
        celebrating ? 'tube-celebrating' : '',
        isDropTarget && !tube.locked && !isComplete ? 'tube-drop-target' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        height: tubeH,
        width: tubeW,
        padding: '6px 4px 4px',
        borderRadius: '999px 999px 40% 40%',
        border: `2px solid ${borderColor}`,
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(6px)',
        boxShadow: celebrating
          ? '0 0 20px rgba(16,185,129,0.6), inset 0 0 12px rgba(255,255,255,0.03)'
          : glowColor !== 'transparent'
          ? `0 0 18px 5px ${glowColor}, inset 0 0 12px rgba(255,255,255,0.03)`
          : 'inset 0 0 12px rgba(255,255,255,0.03)',
        transform: isSelected ? 'scale(1.04) translateY(-2px)' : 'scale(1) translateY(0)',
        transition: 'transform 200ms cubic-bezier(0.34,1.56,0.64,1), border-color 150ms ease, box-shadow 150ms ease',
        animationDelay: `${entranceDelay}ms`,
        opacity: tube.locked ? 0.55 : 1,
        gap: 4,
      }}
      onClick={() => !tube.locked && onClick(index)}
      role="button"
      aria-label={`Tüp ${index + 1}, ${tube.rings.length} halka`}
    >
      {/* Rings — rendered bottom-up (flex-col-reverse) */}
      {tube.rings.map((ring, ri) => {
        const isTop = ri === tube.rings.length - 1
        return (
          <Ring
            key={ri}
            ring={ring}
            size={ringSize}
            lifted={isSelected && isTop}
            isNew={ri === newestRingIndex}
          />
        )
      })}

      {/* Empty slot ghosts */}
      {Array.from({ length: tube.capacity - tube.rings.length }).map((_, i) => (
        <div
          key={`e-${i}`}
          style={{
            height: slotH - 10,
            width: tubeW - 16,
            borderRadius: 999,
            border: '1px solid rgba(255,255,255,0.08)',
            flexShrink: 0,
          }}
        />
      ))}

      {/* Tube opening rim highlight */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 rounded-full pointer-events-none"
        style={{
          height: 4,
          width: tubeW - 12,
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)',
        }}
      />

      {/* Complete checkmark badge */}
      {isComplete && (
        <div
          className="absolute -top-4 left-1/2 -translate-x-1/2 text-emerald-400 font-bold text-sm animate-bounce"
          style={{ textShadow: '0 0 8px rgba(52,211,153,0.8)' }}
        >
          ✓
        </div>
      )}

      {/* Lock icon */}
      {tube.locked && (
        <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-gray-500 text-sm">🔒</div>
      )}

      {/* Hint arrow above tube */}
      {(isHintFrom || isHintTo) && (
        <div
          className={`hint-arrow absolute -top-7 left-1/2 -translate-x-1/2 text-lg animate-bounce ${isHintFrom ? 'text-yellow-300' : 'text-green-400'}`}
          style={{ filter: 'drop-shadow(0 0 6px currentColor)' }}
        >
          {isHintFrom ? '↑' : '↓'}
        </div>
      )}
    </div>
  )
}
