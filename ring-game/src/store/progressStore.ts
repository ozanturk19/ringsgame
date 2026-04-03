/**
 * Progress Store — persists level completion data via localStorage.
 * localStorage is abstracted behind a thin layer for future React Native migration
 * (swap localStorage calls with AsyncStorage).
 */

import { create } from 'zustand'
import type { LevelProgress, ProgressState } from '../types'

const STORAGE_KEY = 'halka-progress-v1'

function loadFromStorage(): ProgressState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultState()
    return JSON.parse(raw) as ProgressState
  } catch {
    return defaultState()
  }
}

function saveToStorage(state: ProgressState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Quota exceeded — silently ignore
  }
}

function defaultState(): ProgressState {
  return {
    levels: {},
    unlockedThemes: ['default'],
    currentLevel: 1,
  }
}

interface ProgressStore extends ProgressState {
  completeLevel: (levelId: number, stars: number, moves: number) => void
  setCurrentLevel: (id: number) => void
  getLevelProgress: (levelId: number) => LevelProgress | null
  isLevelUnlocked: (levelId: number) => boolean
  resetProgress: () => void
}

export const useProgressStore = create<ProgressStore>((set, get) => ({
  ...loadFromStorage(),

  completeLevel(levelId, stars, moves) {
    set(state => {
      const existing = state.levels[levelId]
      const best = existing
        ? {
            stars: Math.max(existing.stars, stars),
            bestMoves: existing.bestMoves === 0 ? moves : Math.min(existing.bestMoves, moves),
            completed: true,
          }
        : { stars, bestMoves: moves, completed: true }

      const newLevels = { ...state.levels, [levelId]: best }
      const newState = { ...state, levels: newLevels }
      saveToStorage(newState)
      return newState
    })
  },

  setCurrentLevel(id) {
    set(state => {
      const newState = { ...state, currentLevel: id }
      saveToStorage(newState)
      return newState
    })
  },

  getLevelProgress(levelId) {
    return get().levels[levelId] ?? null
  },

  isLevelUnlocked(levelId) {
    if (levelId <= 1) return true
    const prev = get().levels[levelId - 1]
    return prev?.completed === true
  },

  resetProgress() {
    const fresh = defaultState()
    saveToStorage(fresh)
    set(fresh)
  },
}))
