import { Ring } from './Ring'
import type { Tube as TubeType } from '../types'

interface TubeProps {
  tube: TubeType
  index: number
  isSelected: boolean
  isShaking: boolean
  isHintFrom: boolean
  isHintTo: boolean
  onClick: (index: number) => void
  entranceDelay?: number
  size?: 'sm' | 'md' | 'lg'
}

export function Tube({
  tube,
  index,
  isSelected,
  isShaking,
  isHintFrom,
  isHintTo,
  onClick,
  entranceDelay = 0,
  size = 'md',
}: TubeProps) {
  const isEmpty = tube.rings.length === 0
  const isFull = tube.rings.length >= tube.capacity
  const isComplete =
    !isEmpty &&
    isFull &&
    tube.rings.every(r => r.color === tube.rings[0].color && r.type === 'normal')

  const ringSize = size

  // Height for each ring slot
  const slotH = size === 'sm' ? 28 : size === 'lg' ? 44 : 36
  const tubeH = tube.capacity * slotH + 24

  const tubeClasses = [
    'relative flex flex-col-reverse items-center justify-start cursor-pointer select-none',
    'rounded-b-full rounded-t-xl border-2 transition-all duration-200',
    'pt-2 pb-1 px-2',
    isSelected
      ? 'border-white shadow-[0_0_16px_4px_rgba(255,255,255,0.6)] scale-105'
      : isHintFrom
      ? 'border-yellow-300 shadow-[0_0_12px_4px_rgba(253,224,71,0.7)] animate-pulse'
      : isHintTo
      ? 'border-green-400 shadow-[0_0_12px_4px_rgba(74,222,128,0.7)] animate-pulse'
      : isComplete
      ? 'border-emerald-400 shadow-[0_0_10px_2px_rgba(52,211,153,0.5)]'
      : tube.locked
      ? 'border-gray-600 cursor-not-allowed opacity-60'
      : 'border-white/20 hover:border-white/50',
    isShaking ? 'animate-shake' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      className={tubeClasses}
      style={{
        height: tubeH,
        width: size === 'sm' ? 64 : size === 'lg' ? 96 : 80,
        background: 'rgba(255,255,255,0.06)',
        backdropFilter: 'blur(4px)',
        animationDelay: `${entranceDelay}ms`,
      }}
      onClick={() => !tube.locked && onClick(index)}
      role="button"
      aria-label={`Tube ${index + 1}, ${tube.rings.length} rings`}
    >
      {/* Rings stacked bottom-up */}
      {tube.rings.map((ring, ri) => {
        const isTop = ri === tube.rings.length - 1
        return (
          <Ring
            key={ri}
            ring={ring}
            size={ringSize}
            lifted={isSelected && isTop}
            animDelay={0}
          />
        )
      })}

      {/* Empty slot indicators */}
      {Array.from({ length: tube.capacity - tube.rings.length }).map((_, i) => (
        <div
          key={`empty-${i}`}
          className="rounded-full opacity-10 border border-white/20"
          style={{
            height: slotH - 8,
            width: size === 'sm' ? 48 : size === 'lg' ? 80 : 64,
            marginBottom: 4,
          }}
        />
      ))}

      {/* Lock icon */}
      {tube.locked && (
        <div className="absolute top-1 left-1/2 -translate-x-1/2 text-gray-400 text-xs">🔒</div>
      )}

      {/* Complete checkmark */}
      {isComplete && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-emerald-400 text-sm animate-bounce">
          ✓
        </div>
      )}
    </div>
  )
}
