// All animation durations in milliseconds — never use magic numbers in components

export const ANIM = {
  RING_LIFT: 200,
  RING_MOVE: 320,
  RING_PLACE: 280,
  INVALID_SHAKE: 380,
  LEVEL_ENTRANCE_STAGGER: 80,   // per tube
  LEVEL_ENTRANCE_TOTAL: 600,
  WIN_CONFETTI: 2000,
  STAR_FILL: 600,
  TUBE_GLOW_PULSE: 1000,        // infinite pulse period
} as const

// Easing functions
export const EASING = {
  SPRING: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  SMOOTH: 'cubic-bezier(0.4, 0, 0.2, 1)',
  BOUNCE: 'cubic-bezier(0.68, -0.55, 0.27, 1.55)',
} as const
