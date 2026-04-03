import type { Ring as RingType } from '../types'
import { COLORS } from '../constants/colors'
import { ANIM, EASING } from '../constants/animations'

interface RingProps {
  ring: RingType
  size?: 'sm' | 'md' | 'lg'
  lifted?: boolean
  isNew?: boolean       // just landed — triggers settle bounce
  entranceDelay?: number
}

const SIZE_MAP = {
  sm: { outer: { height: 24, width: 52 }, hole: { height: 10, width: 24 } },
  md: { outer: { height: 32, width: 68 }, hole: { height: 14, width: 32 } },
  lg: { outer: { height: 40, width: 84 }, hole: { height: 18, width: 40 } },
}

export function Ring({ ring, size = 'md', lifted = false, isNew = false, entranceDelay = 0 }: RingProps) {
  const color = COLORS[ring.color]
  const dims = SIZE_MAP[size]
  const isBlocker = ring.type === 'blocker'

  return (
    <div
      className={[
        'relative flex items-center justify-center rounded-full select-none will-change-transform',
        isBlocker ? 'opacity-55 grayscale' : '',
        isNew ? 'animate-ring-settle' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        height: dims.outer.height,
        width: dims.outer.width,
        flexShrink: 0,
        background: `radial-gradient(circle at 32% 32%, ${color.shine}, ${color.hex} 55%, ${color.dark})`,
        boxShadow: lifted
          ? `0 10px 24px ${color.dark}88, inset 0 1px 3px ${color.shine}99`
          : `0 2px 8px ${color.dark}55, inset 0 1px 2px ${color.shine}66`,
        transform: lifted ? `translateY(-${size === 'lg' ? 14 : size === 'sm' ? 8 : 10}px) scale(1.06)` : 'translateY(0) scale(1)',
        transition: `transform ${ANIM.RING_LIFT}ms ${EASING.SPRING}, box-shadow ${ANIM.RING_LIFT}ms ${EASING.SMOOTH}`,
        transitionDelay: `${entranceDelay}ms`,
        animationDelay: `${entranceDelay}ms`,
      }}
    >
      {/* Centre hole */}
      <div
        className="rounded-full"
        style={{
          height: dims.hole.height,
          width: dims.hole.width,
          background: 'rgba(0,0,0,0.6)',
          boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.8)',
        }}
      />
      {/* Shine strip */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          top: 4,
          left: size === 'sm' ? 10 : 14,
          height: 4,
          width: size === 'sm' ? 18 : size === 'lg' ? 28 : 22,
          background: color.shine,
          opacity: 0.45,
          filter: 'blur(1px)',
        }}
      />
      {/* Blocker X */}
      {isBlocker && (
        <span className="absolute inset-0 flex items-center justify-center text-white font-black text-xs pointer-events-none select-none">
          ✕
        </span>
      )}
    </div>
  )
}
