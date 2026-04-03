import { useEffect, useRef, useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { getMoveCount, isTubeComplete } from '../game/engine'
import { getLevel } from '../game/levels'
import { Tube } from '../components/Tube'
import { BottomBar } from '../components/BottomBar'
import { ANIM } from '../constants/animations'
import { useSound } from '../hooks/useSound'
import { useTimer } from '../hooks/useTimer'

const INITIAL_TIME = 150
const TIME_BONUS = 30
const SCORE_PER_LEVEL = 100
const BEST_SCORE_KEY = 'halka-timed-best-v1'

interface TimedModeScreenProps {
  onBack: () => void
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function getBestScore(): number {
  try {
    return parseInt(localStorage.getItem(BEST_SCORE_KEY) ?? '0', 10) || 0
  } catch {
    return 0
  }
}

function saveBestScore(score: number) {
  try {
    const prev = getBestScore()
    if (score > prev) localStorage.setItem(BEST_SCORE_KEY, String(score))
  } catch {
    // ignore
  }
}

export function TimedModeScreen({ onBack }: TimedModeScreenProps) {
  const {
    gameState,
    phase,
    selectedTubeIndex,
    shakingTubeIndex,
    hintTubeFrom,
    hintTubeTo,
    canSkip,
    loadLevel,
    selectTube,
    undo,
    reset,
    skip,
    useHint,
    clearHint,
  } = useGameStore()

  const { play } = useSound()
  const prevMoveCount = useRef(0)
  const prevPhase = useRef(phase)
  const [celebrating, setCelebrating] = useState(false)

  // Game session state
  const [currentLevelId, setCurrentLevelId] = useState(1)
  const [levelsCompleted, setLevelsCompleted] = useState(0)
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [gameStarted, setGameStarted] = useState(false)
  const [newBest, setNewBest] = useState(false)

  const { secondsLeft, start, pause, reset: resetTimer, isExpired } = useTimer(INITIAL_TIME)

  // Load first level on mount
  useEffect(() => {
    loadLevel(1)
    setCurrentLevelId(1)
  }, [])

  // Start timer on first interaction — we start it immediately when screen opens
  useEffect(() => {
    if (!gameStarted && gameState) {
      setGameStarted(true)
      start()
    }
  }, [gameState])

  // Handle time expiry
  useEffect(() => {
    if (isExpired && gameStarted && !gameOver) {
      pause()
      const finalScore = levelsCompleted * SCORE_PER_LEVEL + 0
      setScore(finalScore)
      setGameOver(true)
      const best = getBestScore()
      if (finalScore > best) {
        saveBestScore(finalScore)
        setNewBest(true)
      }
    }
  }, [isExpired])

  // Sound effects
  useEffect(() => {
    if (!gameState) return
    const moves = getMoveCount(gameState)
    if (phase === 'TUBE_SELECTED' && prevPhase.current === 'IDLE') play('pick')
    if (moves > prevMoveCount.current) { play('place'); prevMoveCount.current = moves }
    if (phase === 'INVALID_SHAKE') play('invalid')
    if (phase === 'LEVEL_COMPLETE' && prevPhase.current !== 'LEVEL_COMPLETE') play('win')
    prevPhase.current = phase
  }, [phase, gameState])

  // Celebrate and auto-advance on level complete
  useEffect(() => {
    if (phase === 'LEVEL_COMPLETE') {
      setCelebrating(true)
      const nextLevelId = currentLevelId + 1
      const nextLevel = getLevel(nextLevelId)

      const timer = setTimeout(() => {
        const newCompleted = levelsCompleted + 1
        const bonus = TIME_BONUS
        // Add bonus time by resetting timer to current + bonus (but keep running)
        // We achieve this by directly setting via resetTimer then restarting
        const newSecondsLeft = secondsLeft + bonus
        resetTimer(newSecondsLeft)
        start()

        setLevelsCompleted(newCompleted)
        setScore(newCompleted * SCORE_PER_LEVEL + newSecondsLeft)

        setCelebrating(false)
        prevMoveCount.current = 0

        if (nextLevel) {
          setCurrentLevelId(nextLevelId)
          loadLevel(nextLevelId)
        } else {
          // Beat all levels! Give a high score
          const finalScore = newCompleted * SCORE_PER_LEVEL + newSecondsLeft
          setScore(finalScore)
          setGameOver(true)
          const best = getBestScore()
          if (finalScore > best) {
            saveBestScore(finalScore)
            setNewBest(true)
          }
        }
      }, 1200)
      return () => clearTimeout(timer)
    }
  }, [phase])

  function handleRestart() {
    setGameOver(false)
    setNewBest(false)
    setLevelsCompleted(0)
    setScore(0)
    setCurrentLevelId(1)
    setGameStarted(false)
    prevMoveCount.current = 0
    resetTimer(INITIAL_TIME)
    loadLevel(1)
  }

  if (!gameState) return null

  const moveCount = getMoveCount(gameState)

  const tubes = gameState.tubes
  const tubeCount = tubes.length
  const tubeSize = tubeCount <= 5 ? 'lg' : tubeCount <= 7 ? 'md' : 'sm'
  const needsWrap = tubeCount >= 7

  const lastMove = gameState.moves.at(-1)
  const newestTubeIdx = lastMove?.toTube ?? -1
  const newestRingIdx = newestTubeIdx >= 0 ? tubes[newestTubeIdx].rings.length - 1 : -1

  const timeIsLow = secondsLeft <= 30 && !gameOver

  return (
    <div className="min-h-screen flex flex-col select-none">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 text-white">
        <button
          onClick={() => { pause(); onBack() }}
          className="flex items-center gap-1 text-white/70 hover:text-white transition-colors text-sm"
          aria-label="Geri"
        >
          ← Geri
        </button>

        {/* Timer */}
        <div className="flex flex-col items-center">
          <span className="text-xs text-white/50 font-medium uppercase tracking-widest">Süre</span>
          <span
            className="text-2xl font-bold leading-tight tabular-nums"
            style={{ color: timeIsLow ? '#EF4444' : 'white', transition: 'color 0.3s' }}
          >
            {formatTime(secondsLeft)}
          </span>
        </div>

        {/* Score */}
        <div className="flex flex-col items-center">
          <span className="text-xs text-white/50 font-medium uppercase tracking-widest">Skor</span>
          <span className="text-2xl font-bold leading-tight tabular-nums">
            {levelsCompleted * SCORE_PER_LEVEL + secondsLeft}
          </span>
        </div>
      </div>

      {/* Level indicator */}
      <div className="flex items-center justify-center gap-6 px-4 py-1 text-white/60 text-sm">
        <span>Level <strong className="text-white">{currentLevelId}</strong></span>
        <span>Tamamlanan: <strong className="text-emerald-400">{levelsCompleted}</strong></span>
        <span>Hamle: <strong className="text-white">{moveCount}</strong></span>
      </div>

      {/* Game area */}
      <div className="flex-1 flex items-center justify-center px-3 py-4 overflow-hidden game-area">
        <div
          className={[
            'flex items-end justify-center tube-grid',
            needsWrap ? 'flex-wrap gap-x-2 gap-y-8 max-w-xs' : 'gap-3',
          ].join(' ')}
        >
          {tubes.map((tube, i) => (
            <Tube
              key={i}
              tube={tube}
              index={i}
              isSelected={selectedTubeIndex === i}
              isShaking={shakingTubeIndex === i}
              isHintFrom={hintTubeFrom === i}
              isHintTo={hintTubeTo === i}
              isComplete={isTubeComplete(tube)}
              celebrating={celebrating}
              isDropTarget={phase === 'TUBE_SELECTED' && i !== selectedTubeIndex}
              onClick={(idx) => { clearHint(); selectTube(idx) }}
              entranceDelay={i * ANIM.LEVEL_ENTRANCE_STAGGER}
              size={tubeSize}
              newestRingIndex={i === newestTubeIdx ? newestRingIdx : undefined}
            />
          ))}
        </div>
      </div>

      <BottomBar
        canUndo={gameState.undoStack.length > 0}
        onUndo={() => { play('pick'); undo() }}
        onReset={reset}
        onHint={useHint}
        hintActive={hintTubeFrom !== null}
        canSkip={canSkip}
        onSkip={skip}
      />

      {/* Time up overlay */}
      {gameOver && (
        <GameOverOverlay
          score={score}
          levelsCompleted={levelsCompleted}
          newBest={newBest}
          bestScore={getBestScore()}
          onRetry={handleRestart}
          onBack={onBack}
        />
      )}
    </div>
  )
}

// ── Game Over Overlay ──────────────────────────────────────────────────────────

interface GameOverOverlayProps {
  score: number
  levelsCompleted: number
  newBest: boolean
  bestScore: number
  onRetry: () => void
  onBack: () => void
}

function GameOverOverlay({ score, levelsCompleted, newBest, bestScore, onRetry, onBack }: GameOverOverlayProps) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80)
    return () => clearTimeout(t)
  }, [])

  return (
    <div
      className={[
        'fixed inset-0 z-50 flex flex-col items-center justify-center',
        'transition-all duration-500',
        visible ? 'opacity-100' : 'opacity-0 pointer-events-none',
      ].join(' ')}
      style={{ background: 'rgba(8,8,24,0.88)', backdropFilter: 'blur(12px)' }}
    >
      <div className="flex flex-col items-center gap-5 text-white text-center px-6 max-w-sm w-full">
        <div className="text-6xl" style={{ filter: 'drop-shadow(0 0 16px rgba(239,68,68,0.6))' }}>⏰</div>
        <h2 className="text-3xl font-black tracking-tight">Süre Doldu!</h2>

        {newBest && (
          <div
            className="px-4 py-1.5 rounded-full text-sm font-bold"
            style={{ background: 'rgba(250,204,21,0.2)', border: '1px solid rgba(250,204,21,0.5)', color: '#fbbf24' }}
          >
            🏆 Yeni Rekor!
          </div>
        )}

        <div className="w-full grid grid-cols-3 gap-2">
          <ScoreBox label="Skor" value={score} highlight={newBest} />
          <ScoreBox label="Level" value={levelsCompleted} />
          <ScoreBox label="En İyi" value={bestScore} />
        </div>

        <div className="flex flex-col gap-2.5 w-full mt-2">
          <button
            onClick={onRetry}
            className="w-full py-4 rounded-2xl font-bold text-lg active:scale-95 transition-all duration-150"
            style={{
              background: 'linear-gradient(135deg, #10b981, #06b6d4)',
              boxShadow: '0 6px 20px rgba(16,185,129,0.4)',
            }}
          >
            ↺ Tekrar Dene
          </button>
          <button
            onClick={onBack}
            className="w-full py-3 rounded-2xl font-semibold active:scale-95 transition-all duration-150"
            style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}
          >
            ← Ana Menü
          </button>
        </div>
      </div>
    </div>
  )
}

interface ScoreBoxProps {
  label: string
  value: number
  highlight?: boolean
}

function ScoreBox({ label, value, highlight }: ScoreBoxProps) {
  return (
    <div
      className="flex flex-col items-center py-3 px-2 rounded-2xl"
      style={{
        background: highlight ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.06)',
        border: highlight ? '1px solid rgba(16,185,129,0.4)' : '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <span className={`text-2xl font-black ${highlight ? 'text-emerald-400' : 'text-white'}`}>{value}</span>
      <span className="text-xs text-white/40 mt-0.5">{label}</span>
    </div>
  )
}
