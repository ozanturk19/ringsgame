import type { Ring as RingType } from '../types'
import { COLORS } from '../constants/colors'
import { ANIM, EASING } from '../constants/animations'

interface RingProps {
  ring: RingType
  ringWidth: number
  ringHeight: number
  lifted?: boolean
  isNew?: boolean
  entranceDelay?: number
}

export function Ring({ ring, ringWidth, ringHeight, lifted = false, isNew = false, entranceDelay = 0 }: RingProps) {
  const color = COLORS[ring.color]
  const isBlocker = ring.type === 'blocker'

  const holeW = Math.round(ringWidth * 0.47)
  const holeH = Math.round(ringHeight * 0.44)
  const liftY = Math.round(ringHeight * 0.35)
  const shineLeft = Math.round(ringWidth * 0.19)
  const shineW = Math.round(ringWidth * 0.34)

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
        height: ringHeight,
        width: ringWidth,
        flexShrink: 0,
        background: `radial-gradient(circle at 32% 32%, ${color.shine}, ${color.hex} 55%, ${color.dark})`,
        boxShadow: lifted
          ? `0 10px 24px ${color.dark}88, inset 0 1px 3px ${color.shine}99`
          : `0 2px 8px ${color.dark}55, inset 0 1px 2px ${color.shine}66`,
        transform: lifted ? `translateY(-${liftY}px) scale(1.06)` : 'translateY(0) scale(1)',
        transition: `transform ${ANIM.RING_LIFT}ms ${EASING.SPRING}, box-shadow ${ANIM.RING_LIFT}ms ${EASING.SMOOTH}`,
        transitionDelay: `${entranceDelay}ms`,
        animationDelay: `${entranceDelay}ms`,
      }}
    >
      {/* Centre hole */}
      <div
        className="rounded-full"
        style={{
          height: holeH,
          width: holeW,
          background: 'rgba(0,0,0,0.6)',
          boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.8)',
        }}
      />
      {/* Shine strip */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          top: 4,
          left: shineLeft,
          height: 4,
          width: shineW,
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
