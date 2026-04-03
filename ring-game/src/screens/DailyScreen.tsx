import { useEffect, useRef, useState } from 'react'
import { getDailyLevel, getDailyRecord, saveDailyRecord, getTodayStr } from '../game/dailyChallenge'
import { createInitialGameState, applyMoveToState, isValidMove, isWinState, isTubeComplete, getMoveCount, calculateStars, undoLastMove } from '../game/engine'
import { getHint } from '../game/solver'
import { Tube } from '../components/Tube'
import { BottomBar } from '../components/BottomBar'
import { WinOverlay } from '../components/WinOverlay'
import { ANIM } from '../constants/animations'
import { useSound } from '../hooks/useSound'
import type { GameState } from '../types'

interface DailyScreenProps {
  onBack: () => void
}

export function DailyScreen({ onBack }: DailyScreenProps) {
  const { play } = useSound()

  const dailyLevel = useRef(getDailyLevel())
  const existingRecord = getDailyRecord()

  const [gameState, setGameState] = useState<GameState | null>(null)
  const [selectedTube, setSelectedTube] = useState<number | null>(null)
  const [shakingTube, setShakingTube] = useState<number | null>(null)
  const [hintFrom, setHintFrom] = useState<number | null>(null)
  const [hintTo, setHintTo] = useState<number | null>(null)
  const [won, setWon] = useState(existingRecord?.completed ?? false)
  const [stars, setStars] = useState(existingRecord?.stars ?? 0)

  useEffect(() => {
    const lvl = dailyLevel.current
    if (!lvl) return
    setGameState(createInitialGameState(lvl.tubes))
  }, [])

  if (!dailyLevel.current) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-white px-6">
        <button onClick={onBack} className="absolute top-4 left-4 text-white/60 hover:text-white">← Geri</button>
        <p className="text-white/50">Günlük bulmaca yüklenemedi.</p>
      </div>
    )
  }

  const lvl = dailyLevel.current
  const tubes = gameState?.tubes ?? lvl.tubes
  const moveCount = gameState ? getMoveCount(gameState) : 0

  function selectTube(idx: number) {
    if (!gameState || won) return

    if (selectedTube === null) {
      if (tubes[idx].rings.length === 0) return
      play('pick')
      setSelectedTube(idx)
      return
    }

    if (selectedTube === idx) { setSelectedTube(null); return }

    const from = selectedTube
    const to = idx

    if (!isValidMove(tubes, from, to)) {
      play('invalid')
      setShakingTube(to)
      setSelectedTube(null)
      setTimeout(() => setShakingTube(null), 420)
      return
    }

    play('place')
    const next = applyMoveToState(gameState, from, to)
    setGameState(next)
    setSelectedTube(null)
    setHintFrom(null); setHintTo(null)

    if (isWinState(next.tubes)) {
      const moves = getMoveCount(next)
      const s = calculateStars(moves, lvl.optimalMoves)
      setStars(s)
      setWon(true)
      play('win')
      saveDailyRecord({ completed: true, stars: s, moves })
    }
  }

  function undo() {
    if (!gameState) return
    play('pick')
    setGameState(undoLastMove(gameState))
    setSelectedTube(null)
  }

  function reset() {
    setGameState(createInitialGameState(lvl.tubes))
    setSelectedTube(null)
    setHintFrom(null); setHintTo(null)
  }

  function hint() {
    if (!gameState) return
    const h = getHint(tubes)
    if (h) { setHintFrom(h[0]); setHintTo(h[1]) }
  }

  const tubeCount = tubes.length
  const tubeSize = tubeCount <= 5 ? 'lg' : tubeCount <= 7 ? 'md' : 'sm'
  const lastMove = gameState?.moves.at(-1)
  const newestTubeIdx = lastMove?.toTube ?? -1
  const newestRingIdx = newestTubeIdx >= 0 ? tubes[newestTubeIdx].rings.length - 1 : -1

  // Countdown to next daily
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(0, 0, 0, 0)
  const hoursLeft = Math.ceil((tomorrow.getTime() - now.getTime()) / 3_600_000)

  return (
    <div className="min-h-screen flex flex-col select-none">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 text-white"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <button onClick={onBack} className="text-white/60 hover:text-white transition-colors text-sm">
          ← Geri
        </button>
        <div className="text-center">
          <p className="text-xs text-white/40 uppercase tracking-widest font-medium">Günlük Bulmaca</p>
          <p className="text-base font-bold">{getTodayStr()}</p>
        </div>
        <div className="flex flex-col items-end">
          <p className="text-xs text-white/40">Sonraki</p>
          <p className="text-sm font-semibold text-purple-400">{hoursLeft}s</p>
        </div>
      </div>

      {/* Already completed banner */}
      {existingRecord?.completed && !won && (
        <div className="mx-4 mt-3 px-4 py-2 rounded-xl text-sm text-center"
          style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399' }}
        >
          Bugünkü bulmacayı {existingRecord.stars}⭐ ile tamamladın! Tekrar oynayabilirsin.
        </div>
      )}

      {/* Game area */}
      <div className="flex-1 flex items-center justify-center px-3 py-4 overflow-hidden">
        <div className="flex items-end justify-center flex-wrap gap-3 max-w-sm">
          {tubes.map((tube, i) => (
            <Tube
              key={i}
              tube={tube}
              index={i}
              isSelected={selectedTube === i}
              isShaking={shakingTube === i}
              isHintFrom={hintFrom === i}
              isHintTo={hintTo === i}
              isComplete={isTubeComplete(tube)}
              onClick={selectTube}
              entranceDelay={i * ANIM.LEVEL_ENTRANCE_STAGGER}
              size={tubeSize}
              newestRingIndex={i === newestTubeIdx ? newestRingIdx : undefined}
            />
          ))}
        </div>
      </div>

      <BottomBar
        canUndo={(gameState?.undoStack.length ?? 0) > 0}
        onUndo={undo}
        onReset={reset}
        onHint={hint}
        hintActive={hintFrom !== null}
        canSkip={false}
        onSkip={() => {}}
      />

      {won && (
        <WinOverlay
          levelId={0}
          stars={stars}
          moveCount={moveCount}
          optimalMoves={lvl.optimalMoves}
          onNext={onBack}
          onMap={onBack}
          onReplay={reset}
        />
      )}
    </div>
  )
}
