/**
 * All 200 game levels — pre-generated at build-time via scripts/generate-levels.ts
 * Runtime'da sıfır BFS/hesaplama. Mobil Safari uyumlu.
 *
 * Level'ları yeniden üretmek için: npm run generate-levels
 */

import type { Level, Difficulty } from '../types'
import levelsData from './levels-data.json'

export const LEVELS: Level[] = levelsData as Level[]

export function getLevel(id: number): Level | undefined {
  return LEVELS.find(l => l.id === id)
}

export function getTotalLevels(): number {
  return LEVELS.length
}

export function getLevelsByDifficulty(difficulty: Difficulty): Level[] {
  return LEVELS.filter(l => l.difficulty === difficulty)
}
