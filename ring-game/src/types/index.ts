// ─── Core Game Types ──────────────────────────────────────────────────────────

export type ColorId =
  | 'red'
  | 'yellow'
  | 'green'
  | 'blue'
  | 'purple'
  | 'orange'
  | 'cyan'
  | 'pink'

export type RingType = 'normal' | 'blocker' | 'locked'

export interface Ring {
  color: ColorId
  type: RingType
}

export interface Tube {
  rings: Ring[]       // index 0 = bottom, last = top
  capacity: number    // default 4
  locked: boolean     // locked tube: cannot receive rings
}

export interface Move {
  fromTube: number
  toTube: number
  timestamp: number
}

export interface GameState {
  tubes: Tube[]
  moves: Move[]
  undoStack: Tube[][]  // each entry is snapshot of tubes before a move
}

// ─── Level Types ──────────────────────────────────────────────────────────────

export type Difficulty = 'tutorial' | 'easy' | 'medium' | 'hard' | 'expert' | 'master'

export interface Level {
  id: number
  difficulty: Difficulty
  tubes: Tube[]
  colors: ColorId[]
  optimalMoves?: number
}

// ─── Progress Types ───────────────────────────────────────────────────────────

export interface LevelProgress {
  stars: number        // 0-3
  bestMoves: number
  completed: boolean
}

export interface ProgressState {
  levels: Record<number, LevelProgress>
  unlockedThemes: string[]
  currentLevel: number
  dailyStreak: number
  bestStreak: number
  lastPlayedDate: string  // 'YYYY-MM-DD'
}

// ─── UI State ─────────────────────────────────────────────────────────────────

export type Screen = 'home' | 'levelMap' | 'game' | 'stats'

export type GamePhase =
  | 'IDLE'
  | 'TUBE_SELECTED'
  | 'MOVING'
  | 'INVALID_SHAKE'
  | 'LEVEL_COMPLETE'

export interface UIState {
  screen: Screen
  selectedTubeIndex: number | null
  shakingTubeIndex: number | null
  phase: GamePhase
}
