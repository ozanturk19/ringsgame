import type { Ring as RingType } from '../types'
import { COLORS } from '../constants/colors'

interface RingProps {
  ring: RingType
  size?: 'sm' | 'md' | 'lg'
  lifted?: boolean
  animDelay?: number
}

const SIZE_MAP = {
  sm: { outer: 'h-6 w-14', inner: 'h-2 w-6', hole: 'h-3 w-7' },
  md: { outer: 'h-8 w-20', inner: 'h-3 w-8', hole: 'h-4 w-10' },
  lg: { outer: 'h-10 w-24', inner: 'h-4 w-10', hole: 'h-5 w-12' },
}

export function Ring({ ring, size = 'md', lifted = false, animDelay = 0 }: RingProps) {
  const color = COLORS[ring.color]
  const dims = SIZE_MAP[size]

  const isBlocker = ring.type === 'blocker'

  return (
    <div
      className={[
        'relative flex items-center justify-center rounded-full transition-transform select-none',
        dims.outer,
        lifted ? '-translate-y-3' : 'translate-y-0',
        isBlocker ? 'opacity-60 grayscale' : '',
      ].join(' ')}
      style={{
        background: `radial-gradient(circle at 35% 35%, ${color.shine}, ${color.hex} 60%, ${color.dark})`,
        boxShadow: `0 2px 8px ${color.dark}66, inset 0 1px 2px ${color.shine}88`,
        transitionDelay: `${animDelay}ms`,
        transitionDuration: '200ms',
      }}
    >
      {/* Centre hole */}
      <div
        className={`rounded-full ${dims.hole}`}
        style={{ background: 'rgba(0,0,0,0.55)' }}
      />
      {/* Shine strip */}
      <div
        className="absolute top-1 left-3 h-1 w-6 rounded-full opacity-40"
        style={{ background: color.shine }}
      />
      {/* Blocker X indicator */}
      {isBlocker && (
        <span className="absolute inset-0 flex items-center justify-center text-white font-bold text-xs pointer-events-none">
          ✕
        </span>
      )}
    </div>
  )
}
