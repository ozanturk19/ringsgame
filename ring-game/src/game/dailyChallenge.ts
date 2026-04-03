/**
 * Daily Challenge — deterministic level based on today's date.
 * Same date = same puzzle for all players worldwide.
 */

import type { Tube } from '../types'
import { generateLevel } from './levelGenerator'
import { solve } from './solver'

const DAILY_STORAGE_KEY = 'halka-daily-v1'

export interface DailyRecord {
  date: string          // 'YYYY-MM-DD'
  completed: boolean
  stars: number
  moves: number
}

export function getTodayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Deterministic seed from date string */
function dateSeed(dateStr: string): number {
  let h = 0x811c9dc5
  for (const ch of dateStr) {
    h ^= ch.charCodeAt(0)
    h = (h * 0x01000193) >>> 0
  }
  return h
}

export interface DailyLevel {
  tubes: Tube[]
  optimalMoves: number
  date: string
}

export function getDailyLevel(): DailyLevel | null {
  const date = getTodayStr()
  const seed = dateSeed(date)

  // Daily levels are always 6-color, 8-tube (hard)
  for (let attempt = 0; attempt < 30; attempt++) {
    const tubes = generateLevel(
      { numColors: 6, numTubes: 8, difficulty: 'hard' },
      seed + attempt
    )
    if (!tubes) continue
    const result = solve(tubes)
    if (!result) continue
    return { tubes, optimalMoves: result.moveCount, date }
  }

  return null
}

export function getDailyRecord(): DailyRecord | null {
  try {
    const raw = localStorage.getItem(DAILY_STORAGE_KEY)
    if (!raw) return null
    const r = JSON.parse(raw) as DailyRecord
    return r.date === getTodayStr() ? r : null
  } catch { return null }
}

export function saveDailyRecord(record: Omit<DailyRecord, 'date'>) {
  try {
    localStorage.setItem(DAILY_STORAGE_KEY, JSON.stringify({ ...record, date: getTodayStr() }))
  } catch { /* ignore */ }
}
