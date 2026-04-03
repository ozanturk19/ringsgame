/**
 * Level Generator — Creates and validates ring-sort puzzle levels.
 * Pure TypeScript, zero DOM. All generated levels are BFS-verified solvable.
 */

import type { Tube, Ring, ColorId, Difficulty } from '../types'
import { COLOR_IDS } from '../constants/colors'
import { isSolvable } from './solver'

export interface LevelConfig {
  numColors: number
  numTubes: number
  difficulty: Difficulty
  hasBlockers?: boolean
  hasLockedTubes?: boolean
  maxEmptyTubes?: number
}

function makeRing(color: ColorId): Ring {
  return { color, type: 'normal' }
}

function makeBlockerRing(color: ColorId): Ring {
  return { color, type: 'blocker' }
}

function makeTube(rings: Ring[] = [], capacity = 4, locked = false): Tube {
  return { rings, capacity, locked }
}

/**
 * Seeded pseudo-random number generator (Mulberry32).
 * Deterministic: same seed = same levels every time.
 */
function mulberry32(seed: number) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}


/**
 * Generate a solved state first, then scramble it by reverse-applying random moves.
 * This guarantees the puzzle is solvable.
 */
export function generateLevel(config: LevelConfig, seed: number): Tube[] | null {
  const { numColors, numTubes, hasBlockers = false } = config
  const rng = mulberry32(seed)

  const colors = COLOR_IDS.slice(0, numColors)

  // Start from solved state: each color fills exactly one tube
  const solvedTubes: Tube[] = []
  for (const color of colors) {
    solvedTubes.push(makeTube([makeRing(color), makeRing(color), makeRing(color), makeRing(color)]))
  }
  // Add empty tubes
  const emptyCount = numTubes - numColors
  for (let i = 0; i < emptyCount; i++) {
    solvedTubes.push(makeTube([]))
  }

  // Scramble by reverse moves
  let tubes = solvedTubes.map(t => ({ ...t, rings: [...t.rings] }))
  const scrambleMoves = numColors * 8 + Math.floor(rng() * numColors * 4)

  for (let i = 0; i < scrambleMoves; i++) {
    const nonEmptyIndices = tubes
      .map((t, idx) => ({ t, idx }))
      .filter(({ t }) => t.rings.length > 0)
      .map(({ idx }) => idx)

    if (nonEmptyIndices.length === 0) break

    const fromIdx = nonEmptyIndices[Math.floor(rng() * nonEmptyIndices.length)]
    const candidateTos = tubes
      .map((_t, idx) => idx)
      .filter(idx => idx !== fromIdx && tubes[idx].rings.length < tubes[idx].capacity)

    if (candidateTos.length === 0) continue

    const toIdx = candidateTos[Math.floor(rng() * candidateTos.length)]
    const ring = tubes[fromIdx].rings[tubes[fromIdx].rings.length - 1]
    tubes[fromIdx] = { ...tubes[fromIdx], rings: tubes[fromIdx].rings.slice(0, -1) }
    tubes[toIdx] = { ...tubes[toIdx], rings: [...tubes[toIdx].rings, ring] }
  }

  // Optionally insert a blocker ring randomly
  if (hasBlockers && rng() > 0.5) {
    const candidateTubes = tubes.filter(tube => tube.rings.length >= 2 && tube.rings.length < tube.capacity)
    if (candidateTubes.length > 0) {
      const idx = Math.floor(rng() * candidateTubes.length)
      const insertPos = Math.floor(rng() * (candidateTubes[idx].rings.length - 1))
      const blockerColor = candidateTubes[idx].rings[insertPos].color
      candidateTubes[idx].rings.splice(insertPos, 0, makeBlockerRing(blockerColor))
    }
  }

  // Verify solvability (skip if state looks already won)
  const alreadyDone = tubes.every(
    t => t.rings.length === 0 || (t.rings.length === 4 && t.rings.every(r => r.color === t.rings[0].color))
  )
  if (alreadyDone) return null

  if (!isSolvable(tubes)) return null

  return tubes
}
