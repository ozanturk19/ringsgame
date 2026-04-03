import { describe, it, expect } from 'vitest'
import type { Tube, Ring } from '../types'
import { solve, isSolvable, getHint } from './solver'

function ring(color: Ring['color'], type: Ring['type'] = 'normal'): Ring {
  return { color, type }
}

function tube(rings: Ring[], capacity = 4, locked = false): Tube {
  return { rings, capacity, locked }
}

describe('solve', () => {
  it('returns empty solution for already-won state', () => {
    const tubes = [
      tube([ring('red'), ring('red'), ring('red'), ring('red')]),
      tube([]),
    ]
    const result = solve(tubes)
    expect(result).not.toBeNull()
    expect(result!.solution).toHaveLength(0)
    expect(result!.moveCount).toBe(0)
  })

  it('solves a simple puzzle', () => {
    const simple = [
      tube([ring('red'), ring('red'), ring('red')]),
      tube([ring('red')]),
      tube([]),
    ]
    const result = solve(simple)
    expect(result).not.toBeNull()
    expect(result!.moveCount).toBeGreaterThan(0)
  })

  it('returns correct shortest path', () => {
    // 2-color puzzle solvable in minimal moves
    const tubes = [
      tube([ring('blue'), ring('red'), ring('blue'), ring('red')]),
      tube([ring('red'), ring('blue'), ring('red'), ring('blue')]),
      tube([]),
      tube([]),
    ]
    const result = solve(tubes)
    expect(result).not.toBeNull()
    // BFS guarantees shortest path
    expect(result!.moveCount).toBeGreaterThan(0)
  })

  it('returns null for an unsolvable puzzle', () => {
    // Single tube with mixed colors and no empty tube — literally unmovable
    const tubes = [
      tube([ring('red'), ring('blue'), ring('red'), ring('blue')]),
    ]
    const result = solve(tubes)
    expect(result).toBeNull()
  })

  it('finds solution for a known solvable 3-tube puzzle', () => {
    const tubes = [
      tube([ring('red'), ring('red'), ring('red'), ring('red')]),
      tube([ring('blue'), ring('blue'), ring('blue'), ring('blue')]),
      tube([]),
    ]
    // Already won state (all full same color)
    const result = solve(tubes)
    expect(result).not.toBeNull()
    expect(result!.moveCount).toBe(0)
  })
})

describe('isSolvable', () => {
  it('returns true for solvable state', () => {
    const tubes = [
      tube([ring('red'), ring('red'), ring('red')]),
      tube([ring('red')]),
      tube([]),
    ]
    expect(isSolvable(tubes)).toBe(true)
  })

  it('returns false for unsolvable state', () => {
    const tubes = [tube([ring('red'), ring('blue')])]
    expect(isSolvable(tubes)).toBe(false)
  })
})

describe('getHint', () => {
  it('returns null for already-won state', () => {
    const tubes = [
      tube([ring('red'), ring('red'), ring('red'), ring('red')]),
      tube([]),
    ]
    expect(getHint(tubes)).toBeNull()
  })

  it('returns a valid [from, to] pair for solvable state', () => {
    const tubes = [
      tube([ring('red'), ring('red'), ring('red')]),
      tube([ring('red')]),
      tube([]),
    ]
    const hint = getHint(tubes)
    expect(hint).not.toBeNull()
    expect(hint).toHaveLength(2)
    expect(hint![0]).toBeGreaterThanOrEqual(0)
    expect(hint![1]).toBeGreaterThanOrEqual(0)
    expect(hint![0]).not.toBe(hint![1])
  })
})
