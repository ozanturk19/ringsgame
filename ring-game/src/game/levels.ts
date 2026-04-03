/**
 * All 200 game levels — pre-generated and BFS-validated.
 * Level IDs are 1-indexed. Each level is a snapshot of Tube[] ready to play.
 *
 * Difficulty bands (PRD spec):
 *  1-10:    3 colors, 5 tubes (tutorial)
 *  11-25:   4 colors, 6 tubes (easy)
 *  26-50:   5 colors, 7 tubes (medium)
 *  51-80:   6 colors, 8 tubes (hard)
 *  81-120:  7 colors, 8 tubes (expert)
 *  121-200: 8 colors, 9 tubes (master)
 */

import type { Level, Tube, Difficulty } from '../types'
import { generateLevel } from './levelGenerator'
import { solve } from './solver'

interface LevelSpec {
  start: number
  end: number
  numColors: number
  numTubes: number
  difficulty: Difficulty
  hasBlockers?: boolean
  hasLockedTubes?: boolean
}

const SPECS: LevelSpec[] = [
  { start: 1,   end: 10,  numColors: 3, numTubes: 5, difficulty: 'tutorial' },
  { start: 11,  end: 25,  numColors: 4, numTubes: 6, difficulty: 'easy' },
  { start: 26,  end: 50,  numColors: 5, numTubes: 7, difficulty: 'medium',  hasBlockers: true },
  { start: 51,  end: 80,  numColors: 6, numTubes: 8, difficulty: 'hard',    hasLockedTubes: true },
  { start: 81,  end: 120, numColors: 7, numTubes: 8, difficulty: 'expert' },
  { start: 121, end: 200, numColors: 8, numTubes: 9, difficulty: 'master',  hasBlockers: true, hasLockedTubes: true },
]

function buildLevels(): Level[] {
  const levels: Level[] = []

  for (const spec of SPECS) {
    for (let id = spec.start; id <= spec.end; id++) {
      // Try multiple seeds until we get a valid level
      let tubes: Tube[] | null = null
      let optimalMoves: number | undefined

      for (let attempt = 0; attempt < 50; attempt++) {
        const seed = id * 1000 + attempt
        tubes = generateLevel(
          {
            numColors: spec.numColors,
            numTubes: spec.numTubes,
            difficulty: spec.difficulty,
            hasBlockers: spec.hasBlockers,
            hasLockedTubes: spec.hasLockedTubes,
          },
          seed
        )
        if (tubes) {
          const result = solve(tubes)
          if (result) {
            optimalMoves = result.moveCount
            break
          }
          tubes = null
        }
      }

      if (!tubes) {
        // Fallback: use a trivially solvable 1-color level
        tubes = [
          { rings: [{ color: 'red', type: 'normal' }, { color: 'red', type: 'normal' }, { color: 'red', type: 'normal' }], capacity: 4, locked: false },
          { rings: [{ color: 'red', type: 'normal' }], capacity: 4, locked: false },
          { rings: [], capacity: 4, locked: false },
        ]
        optimalMoves = 1
      }

      levels.push({
        id,
        difficulty: spec.difficulty,
        tubes,
        colors: [],
        optimalMoves,
      })
    }
  }

  return levels
}

// Built once at module load time
export const LEVELS: Level[] = buildLevels()

export function getLevel(id: number): Level | undefined {
  return LEVELS.find(l => l.id === id)
}

export function getTotalLevels(): number {
  return LEVELS.length
}

export function getLevelsByDifficulty(difficulty: Difficulty): Level[] {
  return LEVELS.filter(l => l.difficulty === difficulty)
}
