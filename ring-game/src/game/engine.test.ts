import { describe, it, expect } from 'vitest'
import type { Tube, Ring } from '../types'
import {
  topRing,
  isTubeFull,
  isTubeEmpty,
  isTubeComplete,
  countTopSameColor,
  isValidMove,
  applyMove,
  isWinState,
  getPossibleMoves,
  serializeState,
  applyMoveToState,
  undoLastMove,
  createInitialGameState,
  calculateStars,
} from './engine'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ring(color: Ring['color'], type: Ring['type'] = 'normal'): Ring {
  return { color, type }
}

function tube(rings: Ring[], capacity = 4, locked = false): Tube {
  return { rings, capacity, locked }
}

// ─── topRing ─────────────────────────────────────────────────────────────────

describe('topRing', () => {
  it('returns null for empty tube', () => {
    expect(topRing(tube([]))).toBeNull()
  })

  it('returns last ring', () => {
    const t = tube([ring('red'), ring('blue')])
    expect(topRing(t)?.color).toBe('blue')
  })
})

// ─── isTubeFull ──────────────────────────────────────────────────────────────

describe('isTubeFull', () => {
  it('returns true when rings === capacity', () => {
    const t = tube([ring('red'), ring('red'), ring('red'), ring('red')])
    expect(isTubeFull(t)).toBe(true)
  })

  it('returns false when tube has space', () => {
    expect(isTubeFull(tube([ring('red')]))).toBe(false)
  })
})

// ─── isTubeEmpty ─────────────────────────────────────────────────────────────

describe('isTubeEmpty', () => {
  it('returns true for empty tube', () => {
    expect(isTubeEmpty(tube([]))).toBe(true)
  })

  it('returns false when tube has rings', () => {
    expect(isTubeEmpty(tube([ring('red')]))).toBe(false)
  })
})

// ─── isTubeComplete ──────────────────────────────────────────────────────────

describe('isTubeComplete', () => {
  it('returns true when full with same color', () => {
    const t = tube([ring('red'), ring('red'), ring('red'), ring('red')])
    expect(isTubeComplete(t)).toBe(true)
  })

  it('returns false when not full', () => {
    const t = tube([ring('red'), ring('red'), ring('red')])
    expect(isTubeComplete(t)).toBe(false)
  })

  it('returns false when mixed colors', () => {
    const t = tube([ring('red'), ring('red'), ring('blue'), ring('red')])
    expect(isTubeComplete(t)).toBe(false)
  })

  it('returns false when contains blocker', () => {
    const t = tube([ring('red'), ring('red', 'blocker'), ring('red'), ring('red')])
    expect(isTubeComplete(t)).toBe(false)
  })
})

// ─── countTopSameColor ───────────────────────────────────────────────────────

describe('countTopSameColor', () => {
  it('returns 0 for empty tube', () => {
    expect(countTopSameColor(tube([]))).toBe(0)
  })

  it('counts consecutive same-color rings from top', () => {
    const t = tube([ring('blue'), ring('red'), ring('red'), ring('red')])
    expect(countTopSameColor(t)).toBe(3)
  })

  it('stops at different color', () => {
    const t = tube([ring('red'), ring('blue'), ring('red')])
    expect(countTopSameColor(t)).toBe(1)
  })

  it('stops at blocker ring', () => {
    const t = tube([ring('red'), ring('red', 'blocker'), ring('red')])
    expect(countTopSameColor(t)).toBe(1)
  })
})

// ─── isValidMove ─────────────────────────────────────────────────────────────

describe('isValidMove', () => {
  it('empty tube is always valid target', () => {
    const tubes = [tube([ring('red')]), tube([])]
    expect(isValidMove(tubes, 0, 1)).toBe(true)
  })

  it('full tube is never valid target', () => {
    const tubes = [
      tube([ring('red')]),
      tube([ring('blue'), ring('blue'), ring('blue'), ring('blue')]),
    ]
    expect(isValidMove(tubes, 0, 1)).toBe(false)
  })

  it('same color on top is valid', () => {
    const tubes = [tube([ring('red')]), tube([ring('red'), ring('blue')])]
    // from=1 (top=blue), to=0 (top=red) — different color
    expect(isValidMove(tubes, 1, 0)).toBe(false)
    // from=0 (top=red), to=1 (top=blue) — different
    expect(isValidMove(tubes, 0, 1)).toBe(false)
  })

  it('different color on top is invalid', () => {
    const tubes = [tube([ring('red')]), tube([ring('blue')])]
    expect(isValidMove(tubes, 0, 1)).toBe(false)
    expect(isValidMove(tubes, 1, 0)).toBe(false)
  })

  it('same color transfer is valid', () => {
    const tubes = [tube([ring('red')]), tube([ring('red')])]
    expect(isValidMove(tubes, 0, 1)).toBe(true)
  })

  it('same tube index is invalid', () => {
    const tubes = [tube([ring('red')])]
    expect(isValidMove(tubes, 0, 0)).toBe(false)
  })

  it('cannot move from empty tube', () => {
    const tubes = [tube([]), tube([])]
    expect(isValidMove(tubes, 0, 1)).toBe(false)
  })

  it('locked tube cannot receive rings', () => {
    const tubes = [tube([ring('red')]), tube([], 4, true)]
    expect(isValidMove(tubes, 0, 1)).toBe(false)
  })

  it('blocker ring cannot be moved', () => {
    const tubes = [tube([ring('red', 'blocker')]), tube([])]
    expect(isValidMove(tubes, 0, 1)).toBe(false)
  })
})

// ─── applyMove ───────────────────────────────────────────────────────────────

describe('applyMove', () => {
  it('moves top ring from one tube to another', () => {
    const tubes = [tube([ring('red'), ring('blue')]), tube([])]
    const result = applyMove(tubes, 0, 1)
    expect(result[0].rings).toHaveLength(1)
    expect(result[0].rings[0].color).toBe('red')
    expect(result[1].rings).toHaveLength(1)
    expect(result[1].rings[0].color).toBe('blue')
  })

  it('preserves original tubes (immutability)', () => {
    const original = [tube([ring('red')]), tube([])]
    applyMove(original, 0, 1)
    expect(original[0].rings).toHaveLength(1)
    expect(original[1].rings).toHaveLength(0)
  })

  it('transfers multiple same-color rings (water-sort behavior)', () => {
    const tubes = [tube([ring('blue'), ring('red'), ring('red')]), tube([])]
    const result = applyMove(tubes, 0, 1)
    // 2 red rings should transfer
    expect(result[0].rings).toHaveLength(1)
    expect(result[1].rings).toHaveLength(2)
    expect(result[1].rings.every(r => r.color === 'red')).toBe(true)
  })

  it('respects capacity when transferring multiple rings', () => {
    // to tube only has 1 space, so only 1 red transfers despite 3 same-color
    const tubes2 = [
      tube([ring('blue'), ring('red'), ring('red'), ring('red')]),
      tube([ring('red')]),
    ]
    const result = applyMove(tubes2, 0, 1)
    expect(result[1].rings).toHaveLength(4)
    expect(result[0].rings).toHaveLength(1)
  })
})

// ─── isWinState ──────────────────────────────────────────────────────────────

describe('isWinState', () => {
  it('returns true when all tubes are complete or empty', () => {
    const tubes = [
      tube([ring('red'), ring('red'), ring('red'), ring('red')]),
      tube([ring('blue'), ring('blue'), ring('blue'), ring('blue')]),
      tube([]),
    ]
    expect(isWinState(tubes)).toBe(true)
  })

  it('returns false when any tube is incomplete', () => {
    const tubes = [
      tube([ring('red'), ring('red'), ring('red'), ring('blue')]),
      tube([ring('blue'), ring('blue'), ring('blue')]),
    ]
    expect(isWinState(tubes)).toBe(false)
  })

  it('returns false for partially filled single-color tube', () => {
    const tubes = [
      tube([ring('red'), ring('red'), ring('red')]),
      tube([]),
    ]
    expect(isWinState(tubes)).toBe(false)
  })
})

// ─── getPossibleMoves ────────────────────────────────────────────────────────

describe('getPossibleMoves', () => {
  it('returns empty array when no moves available', () => {
    const tubes = [
      tube([ring('red'), ring('red'), ring('red'), ring('red')]),
      tube([ring('blue'), ring('blue'), ring('blue'), ring('blue')]),
    ]
    expect(getPossibleMoves(tubes)).toHaveLength(0)
  })

  it('returns moves to empty tube', () => {
    const tubes = [tube([ring('red')]), tube([])]
    const moves = getPossibleMoves(tubes)
    expect(moves.some(([f, t]) => f === 0 && t === 1)).toBe(true)
  })
})

// ─── serializeState ──────────────────────────────────────────────────────────

describe('serializeState', () => {
  it('produces identical strings for identical states', () => {
    const tubes = [tube([ring('red'), ring('blue')]), tube([])]
    expect(serializeState(tubes)).toBe(serializeState(tubes))
  })

  it('produces different strings for different states', () => {
    const a = [tube([ring('red')]), tube([ring('blue')])]
    const b = [tube([ring('blue')]), tube([ring('red')])]
    expect(serializeState(a)).not.toBe(serializeState(b))
  })
})

// ─── Undo / Reset ─────────────────────────────────────────────────────────────

describe('undoLastMove', () => {
  it('reverts to previous state', () => {
    const initial = createInitialGameState([tube([ring('red')]), tube([])])
    const afterMove = applyMoveToState(initial, 0, 1)
    const afterUndo = undoLastMove(afterMove)

    expect(afterUndo.tubes[0].rings).toHaveLength(1)
    expect(afterUndo.tubes[1].rings).toHaveLength(0)
    expect(afterUndo.moves).toHaveLength(0)
  })

  it('does nothing on empty undo stack', () => {
    const state = createInitialGameState([tube([ring('red')])])
    expect(undoLastMove(state)).toBe(state)
  })
})

// ─── calculateStars ──────────────────────────────────────────────────────────

describe('calculateStars', () => {
  it('gives 3 stars at optimal', () => {
    expect(calculateStars(10, 10)).toBe(3)
  })

  it('gives 3 stars within 120%', () => {
    expect(calculateStars(12, 10)).toBe(3)
  })

  it('gives 2 stars within 200%', () => {
    expect(calculateStars(18, 10)).toBe(2)
  })

  it('gives 1 star above 200%', () => {
    expect(calculateStars(25, 10)).toBe(1)
  })
})
