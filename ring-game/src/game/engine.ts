/**
 * Game Engine — Pure TypeScript, zero DOM dependencies.
 * All functions are pure (no side effects) and return new immutable state.
 * Safe to use in React Native, Web Workers, or server-side build scripts.
 */

import type { Tube, Ring, GameState, Move } from '../types'

// ─── Tube Helpers ─────────────────────────────────────────────────────────────

export function topRing(tube: Tube): Ring | null {
  return tube.rings.length > 0 ? tube.rings[tube.rings.length - 1] : null
}

export function isTubeFull(tube: Tube): boolean {
  return tube.rings.length >= tube.capacity
}

export function isTubeEmpty(tube: Tube): boolean {
  return tube.rings.length === 0
}

export function isTubeComplete(tube: Tube): boolean {
  if (tube.rings.length !== tube.capacity) return false
  const firstColor = tube.rings[0].color
  return tube.rings.every(r => r.color === firstColor && r.type === 'normal')
}

/**
 * Count how many rings from the top share the same color (water-sort behavior).
 * Used to determine how many rings move together in one action.
 */
export function countTopSameColor(tube: Tube): number {
  if (tube.rings.length === 0) return 0
  const topColor = tube.rings[tube.rings.length - 1].color
  let count = 0
  for (let i = tube.rings.length - 1; i >= 0; i--) {
    if (tube.rings[i].color === topColor && tube.rings[i].type === 'normal') {
      count++
    } else {
      break
    }
  }
  return count
}

// ─── Move Validation ──────────────────────────────────────────────────────────

/**
 * Returns true if moving the top ring(s) from `from` to `to` is legal.
 * Rules:
 *  1. `from` must not be empty
 *  2. `to` must not be locked
 *  3. `to` must not be full
 *  4. top ring of `from` must not be a blocker
 *  5. `to` is empty OR top ring of `to` is same color as top ring of `from`
 */
export function isValidMove(tubes: Tube[], from: number, to: number): boolean {
  if (from === to) return false
  const fromTube = tubes[from]
  const toTube = tubes[to]

  if (isTubeEmpty(fromTube)) return false
  if (toTube.locked) return false
  if (isTubeFull(toTube)) return false

  const movingRing = topRing(fromTube)!
  if (movingRing.type === 'blocker') return false

  if (isTubeEmpty(toTube)) return true

  const toTop = topRing(toTube)!
  if (toTop.type === 'blocker') return false

  return movingRing.color === toTop.color
}

// ─── Move Application ─────────────────────────────────────────────────────────

/**
 * Applies a move and returns a NEW tubes array (immutable).
 * Moves ALL consecutive same-color rings from the top of `from` to `to`
 * as long as there's space (water-sort behavior).
 */
export function applyMove(tubes: Tube[], from: number, to: number): Tube[] {
  const newTubes = tubes.map(t => ({ ...t, rings: [...t.rings] }))
  const fromTube = newTubes[from]
  const toTube = newTubes[to]

  const movingCount = countTopSameColor(fromTube)
  const availableSpace = toTube.capacity - toTube.rings.length
  const actualMove = Math.min(movingCount, availableSpace)

  const ringsToMove = fromTube.rings.splice(fromTube.rings.length - actualMove, actualMove)
  toTube.rings.push(...ringsToMove)

  return newTubes
}

// ─── Win Condition ────────────────────────────────────────────────────────────

/**
 * Returns true when every tube is either empty or contains exactly
 * `capacity` rings all of the same color (no blockers).
 */
export function isWinState(tubes: Tube[]): boolean {
  return tubes.every(tube => isTubeEmpty(tube) || isTubeComplete(tube))
}

// ─── Possible Moves ───────────────────────────────────────────────────────────

/**
 * Returns all legal (from, to) pairs for the current tube layout.
 */
export function getPossibleMoves(tubes: Tube[]): Array<[number, number]> {
  const moves: Array<[number, number]> = []
  for (let from = 0; from < tubes.length; from++) {
    for (let to = 0; to < tubes.length; to++) {
      if (isValidMove(tubes, from, to)) {
        moves.push([from, to])
      }
    }
  }
  return moves
}

// ─── State Serialization ──────────────────────────────────────────────────────

/**
 * Deterministic string representation of tube state for BFS visited set.
 * Format: "r,r,r,r|y,y,y,y|..." where each tube is pipe-separated
 * and rings are comma-separated color initials (bottom to top).
 */
export function serializeState(tubes: Tube[]): string {
  return tubes
    .map(t => t.rings.map(r => `${r.color[0]}${r.type === 'blocker' ? 'B' : r.type === 'locked' ? 'L' : ''}`).join(','))
    .join('|')
}

// ─── Full GameState Helpers ───────────────────────────────────────────────────

export function createInitialGameState(tubes: Tube[]): GameState {
  return {
    tubes: tubes.map(t => ({ ...t, rings: [...t.rings] })),
    moves: [],
    undoStack: [],
  }
}

export function applyMoveToState(state: GameState, from: number, to: number): GameState {
  const newTubes = applyMove(state.tubes, from, to)
  const move: Move = { fromTube: from, toTube: to, timestamp: Date.now() }
  return {
    tubes: newTubes,
    moves: [...state.moves, move],
    undoStack: [...state.undoStack, state.tubes],
  }
}

export function undoLastMove(state: GameState): GameState {
  if (state.undoStack.length === 0) return state
  const previousTubes = state.undoStack[state.undoStack.length - 1]
  return {
    tubes: previousTubes,
    moves: state.moves.slice(0, -1),
    undoStack: state.undoStack.slice(0, -1),
  }
}

export function resetToInitial(initialTubes: Tube[]): GameState {
  return createInitialGameState(initialTubes)
}

export function getMoveCount(state: GameState): number {
  return state.moves.length
}

/**
 * Star rating based on move efficiency.
 *  3 stars: within 120% of optimal
 *  2 stars: within 200% of optimal
 *  1 star:  completed but above 200%
 */
export function calculateStars(moveCount: number, optimalMoves: number): number {
  const ratio = moveCount / optimalMoves
  if (ratio <= 1.2) return 3
  if (ratio <= 2.0) return 2
  return 1
}
