import { useEffect, useRef, useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { getMoveCount, calculateStars, isTubeComplete } from '../game/engine'
import { getLevel } from '../game/levels'
import { Tube } from '../components/Tube'
import { TopBar } from '../components/TopBar'
import { BottomBar } from '../components/BottomBar'
import { WinOverlay } from '../components/WinOverlay'
import { TutorialOverlay } from '../components/TutorialOverlay'
import { ANIM } from '../constants/animations'
import { useSound } from '../hooks/useSound'
import { useTutorial } from '../hooks/useTutorial'

interface GameScreenProps {
  levelId: number
  onBack: () => void
  onNextLevel: (id: number) => void
}

export function GameScreen({ levelId, onBack, onNextLevel }: GameScreenProps) {
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
  const [showWinOverlay, setShowWinOverlay] = useState(false)

  const { message: tutorialMessage, dismiss: dismissTutorial } = useTutorial(levelId)

  useEffect(() => {
    loadLevel(levelId)
    prevMoveCount.current = 0
  }, [levelId])

  useEffect(() => {
    if (!gameState) return
    const moves = getMoveCount(gameState)

    if (phase === 'TUBE_SELECTED' && prevPhase.current === 'IDLE') play('pick')
    if (moves > prevMoveCount.current) { play('place'); prevMoveCount.current = moves }
    if (phase === 'INVALID_SHAKE') play('invalid')
    if (phase === 'LEVEL_COMPLETE' && prevPhase.current !== 'LEVEL_COMPLETE') play('win')
    prevPhase.current = phase
  }, [phase, gameState])

  useEffect(() => {
    if (phase === 'LEVEL_COMPLETE') {
      setCelebrating(true)
      setShowWinOverlay(false)
      const timer = setTimeout(() => setShowWinOverlay(true), 350)
      return () => clearTimeout(timer)
    } else {
      setCelebrating(false)
      setShowWinOverlay(false)
    }
  }, [phase])

  if (!gameState) return null

  const moveCount = getMoveCount(gameState)
  const level = getLevel(levelId)
  const optimalMoves = level?.optimalMoves ?? moveCount
  const stars = phase === 'LEVEL_COMPLETE'
    ? calculateStars(moveCount, optimalMoves)
    : 0

  const tubes = gameState.tubes
  const tubeCount = tubes.length

  // ── Responsive tube sizing (CSS Grid tabanlı) ─────────────────────
  const needsWrap = tubeCount > 5
  const numCols = needsWrap ? Math.ceil(tubeCount / 2) : tubeCount
  // Ring boyutu sütun sayısına göre — JS'e bağımlılık yok
  const ringSize: 'sm' | 'md' | 'lg' = numCols >= 6 ? 'sm' : numCols >= 5 ? 'md' : 'lg'
  const slotH = ringSize === 'sm' ? 28 : ringSize === 'md' ? 36 : 44
  // ──────────────────────────────────────────────────────────────────

  const lastMove = gameState.moves.at(-1)
  const newestTubeIdx = lastMove?.toTube ?? -1
  const newestRingIdx = newestTubeIdx >= 0 ? tubes[newestTubeIdx].rings.length - 1 : -1

  return (
    <div className="min-h-screen flex flex-col select-none">
      <TopBar levelId={levelId} moveCount={moveCount} onBack={onBack} />

      {/* Game area — CSS Grid ile taşma imkansız */}
      <div className="flex-1 flex items-center py-4 overflow-hidden game-area w-full">
        <div
          className="tube-grid w-full"
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${numCols}, 1fr)`,
            gap: 8,
            rowGap: slotH * 3.2,
            alignItems: 'end',
          }}
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
              size={ringSize}
              slotHeight={slotH}
              fullWidth
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

      {tutorialMessage && !showWinOverlay && (
        <TutorialOverlay
          message={tutorialMessage}
          visible={true}
          onDismiss={dismissTutorial}
          position="bottom"
        />
      )}

      {showWinOverlay && (
        <WinOverlay
          levelId={levelId}
          stars={stars}
          moveCount={moveCount}
          optimalMoves={optimalMoves}
          onNext={() => onNextLevel(levelId + 1)}
          onMap={onBack}
          onReplay={() => loadLevel(levelId)}
        />
      )}
    </div>
  )
}
