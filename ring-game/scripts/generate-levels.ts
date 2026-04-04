/**
 * Build-time level generator.
 * Runs via: npm run generate-levels
 * Outputs: src/game/levels-data.json
 *
 * Bu script 200 level'ı generate + BFS-validate eder ve sonucu
 * JSON olarak kaydeder. Runtime'da sıfır hesaplama yapılır.
 */

import { writeFileSync } from 'fs'
import { resolve } from 'path'
import { generateLevel } from '../src/game/levelGenerator'
import { solve } from '../src/game/solver'
import type { Difficulty, Tube } from '../src/types'

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

const FALLBACK_TUBES: Tube[] = [
  { rings: [{ color: 'red', type: 'normal' }, { color: 'red', type: 'normal' }, { color: 'red', type: 'normal' }], capacity: 4, locked: false },
  { rings: [{ color: 'red', type: 'normal' }], capacity: 4, locked: false },
  { rings: [], capacity: 4, locked: false },
]

console.log('Level\'lar üretiliyor...')
const start = Date.now()

const levels = []
let fallbackCount = 0

for (const spec of SPECS) {
  for (let id = spec.start; id <= spec.end; id++) {
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
      tubes = FALLBACK_TUBES
      optimalMoves = 1
      fallbackCount++
      console.warn(`  ⚠ Level ${id}: fallback kullanıldı`)
    }

    levels.push({ id, difficulty: spec.difficulty, tubes, colors: [], optimalMoves })

    if (id % 20 === 0) {
      process.stdout.write(`  ${id}/200 tamamlandı\r`)
    }
  }
}

const elapsed = ((Date.now() - start) / 1000).toFixed(1)
const outPath = resolve(import.meta.dirname, '../src/game/levels-data.json')
writeFileSync(outPath, JSON.stringify(levels, null, 0))

console.log(`\n✓ 200 level üretildi (${elapsed}s)${fallbackCount ? `, ${fallbackCount} fallback` : ''}`)
console.log(`  → ${outPath}`)
