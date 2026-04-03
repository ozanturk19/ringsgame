/**
 * BFS Solver — Pure TypeScript, zero DOM dependencies.
 * Finds the shortest solution path for a given tube configuration.
 * Returns null for unsolvable states.
 */

import type { Tube } from '../types'
import {
  applyMove,
  getPossibleMoves,
  isWinState,
  serializeState,
} from './engine'

export interface SolveResult {
  solution: Array<[number, number]>   // sequence of [from, to] moves
  moveCount: number
}

const MAX_BFS_STATES = 200_000

/**
 * Solves the puzzle using BFS and returns the optimal solution path.
 * Returns null if the puzzle is unsolvable or exceeds state limit.
 */
export function solve(tubes: Tube[]): SolveResult | null {
  if (isWinState(tubes)) return { solution: [], moveCount: 0 }

  type State = {
    tubes: Tube[]
    path: Array<[number, number]>
  }

  const visited = new Set<string>()
  const queue: State[] = [{ tubes, path: [] }]
  visited.add(serializeState(tubes))

  while (queue.length > 0) {
    if (visited.size > MAX_BFS_STATES) return null

    const current = queue.shift()!
    const moves = getPossibleMoves(current.tubes)

    for (const [from, to] of moves) {
      const nextTubes = applyMove(current.tubes, from, to)
      const key = serializeState(nextTubes)

      if (visited.has(key)) continue
      visited.add(key)

      const newPath: Array<[number, number]> = [...current.path, [from, to]]

      if (isWinState(nextTubes)) {
        return { solution: newPath, moveCount: newPath.length }
      }

      queue.push({ tubes: nextTubes, path: newPath })
    }
  }

  return null
}

/**
 * Returns true if the puzzle is solvable.
 * Used at build time to validate all levels.
 */
export function isSolvable(tubes: Tube[]): boolean {
  return solve(tubes) !== null
}

/**
 * Returns the next single best move for the hint system.
 * Returns null if already solved or unsolvable.
 */
export function getHint(tubes: Tube[]): [number, number] | null {
  if (isWinState(tubes)) return null
  const result = solve(tubes)
  if (!result || result.solution.length === 0) return null
  return result.solution[0]
}
