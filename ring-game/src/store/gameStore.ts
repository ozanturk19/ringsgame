/**
 * Game Store — manages active game session state.
 * Connects the pure engine functions to React via Zustand.
 */

import { create } from 'zustand'
import type { GameState, GamePhase, Tube } from '../types'
import {
  createInitialGameState,
  applyMoveToState,
  undoLastMove,
  isValidMove,
  isWinState,
  getMoveCount,
  calculateStars,
} from '../game/engine'
import { getHint } from '../game/solver'
import { getLevel } from '../game/levels'
import { useProgressStore } from './progressStore'

// After this many resets/undos the skip button unlocks
const SKIP_THRESHOLD = 3

interface GameStore {
  levelId: number | null
  initialTubes: Tube[]
  gameState: GameState | null
  phase: GamePhase
  selectedTubeIndex: number | null
  shakingTubeIndex: number | null
  hintTubeFrom: number | null
  hintTubeTo: number | null
  resetCount: number       // resets on current level — unlocks skip
  canSkip: boolean

  loadLevel: (levelId: number) => void
  selectTube: (index: number) => void
  clearSelection: () => void
  undo: () => void
  reset: () => void
  skip: () => void
  useHint: () => void
  clearHint: () => void
}

export const useGameStore = create<GameStore>((set, get) => ({
  levelId: null,
  initialTubes: [],
  gameState: null,
  phase: 'IDLE',
  selectedTubeIndex: null,
  shakingTubeIndex: null,
  hintTubeFrom: null,
  hintTubeTo: null,
  resetCount: 0,
  canSkip: false,

  loadLevel(levelId) {
    const level = getLevel(levelId)
    if (!level) return

    const initialTubes = level.tubes.map(t => ({ ...t, rings: [...t.rings] }))
    set({
      levelId,
      initialTubes,
      gameState: createInitialGameState(initialTubes),
      phase: 'IDLE',
      selectedTubeIndex: null,
      shakingTubeIndex: null,
      hintTubeFrom: null,
      hintTubeTo: null,
      resetCount: 0,
      canSkip: false,
    })
    useProgressStore.getState().setCurrentLevel(levelId)
  },

  selectTube(index) {
    const { gameState, phase, selectedTubeIndex } = get()
    if (!gameState) return
    if (phase === 'LEVEL_COMPLETE' || phase === 'MOVING') return

    // First selection
    if (selectedTubeIndex === null) {
      const tube = gameState.tubes[index]
      if (tube.rings.length === 0) return
      set({ selectedTubeIndex: index, phase: 'TUBE_SELECTED', hintTubeFrom: null, hintTubeTo: null })
      return
    }

    // Deselect
    if (selectedTubeIndex === index) {
      set({ selectedTubeIndex: null, phase: 'IDLE' })
      return
    }

    const from = selectedTubeIndex
    const to = index
    const tubes = gameState.tubes

    if (!isValidMove(tubes, from, to)) {
      set({ shakingTubeIndex: to, selectedTubeIndex: null, phase: 'INVALID_SHAKE' })
      setTimeout(() => {
        set(s => s.phase === 'INVALID_SHAKE' ? { shakingTubeIndex: null, phase: 'IDLE' } : {})
      }, 420)
      return
    }

    const newState = applyMoveToState(gameState, from, to)
    const won = isWinState(newState.tubes)

    set({
      gameState: newState,
      selectedTubeIndex: null,
      phase: won ? 'LEVEL_COMPLETE' : 'IDLE',
      hintTubeFrom: null,
      hintTubeTo: null,
    })

    if (won) {
      const level = getLevel(get().levelId!)
      const moves = getMoveCount(newState)
      const stars = calculateStars(moves, level?.optimalMoves ?? moves)
      useProgressStore.getState().completeLevel(get().levelId!, stars, moves)
    }
  },

  clearSelection() {
    set({ selectedTubeIndex: null, phase: 'IDLE' })
  },

  undo() {
    const { gameState } = get()
    if (!gameState) return
    const newState = undoLastMove(gameState)
    set({ gameState: newState, selectedTubeIndex: null, phase: 'IDLE', hintTubeFrom: null, hintTubeTo: null })
  },

  reset() {
    const { initialTubes, resetCount } = get()
    const newCount = resetCount + 1
    set({
      gameState: createInitialGameState(initialTubes),
      phase: 'IDLE',
      selectedTubeIndex: null,
      shakingTubeIndex: null,
      hintTubeFrom: null,
      hintTubeTo: null,
      resetCount: newCount,
      canSkip: newCount >= SKIP_THRESHOLD,
    })
  },

  skip() {
    const { levelId, canSkip } = get()
    if (!canSkip || levelId === null) return
    // Mark as skipped (1 star, 999 moves) so next level unlocks
    useProgressStore.getState().completeLevel(levelId, 1, 999)
    // Load next level
    const nextId = levelId + 1
    const nextLevel = getLevel(nextId)
    if (nextLevel) get().loadLevel(nextId)
  },

  useHint() {
    const { gameState } = get()
    if (!gameState) return
    const hint = getHint(gameState.tubes)
    if (!hint) return
    set({ hintTubeFrom: hint[0], hintTubeTo: hint[1] })
  },

  clearHint() {
    set({ hintTubeFrom: null, hintTubeTo: null })
  },
}))
