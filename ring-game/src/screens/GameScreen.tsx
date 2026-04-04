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

  const needsWrap = tubeCount > 5
  const numCols = needsWrap ? Math.ceil(tubeCount / 2) : tubeCount
  const gap = 6
  // Size based on column count only — no JS viewport measurement.
  // CSS Grid 1fr handles actual widths; we just pick ring size conservatively.
  // numCols 5 → sm (52px ring, ~67px cell on 375px phone)
  // numCols 4 → md (68px ring, ~85px cell on 375px phone)
  // numCols ≤3 → lg (84px ring, fits easily)
  const size: 'sm' | 'md' | 'lg' = numCols >= 5 ? 'sm' : numCols >= 4 ? 'md' : 'lg'
  const slotH = size === 'lg' ? 44 : size === 'md' ? 36 : 28

  const lastMove = gameState.moves.at(-1)
  const newestTubeIdx = lastMove?.toTube ?? -1
  const newestRingIdx = newestTubeIdx >= 0 ? tubes[newestTubeIdx].rings.length - 1 : -1

  return (
    <div className="min-h-screen flex flex-col select-none">
      <TopBar levelId={levelId} moveCount={moveCount} onBack={onBack} />

      {/* Game area */}
      <div className="flex-1 flex items-center justify-center px-2 py-4 game-area" style={{ overflow: 'hidden' }}>
        <div
          className="tube-grid w-full"
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${numCols}, 1fr)`,
            columnGap: gap,
            rowGap: slotH * 3,
            alignItems: 'end',
            justifyItems: 'center',
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
              size={size}
              slotHeight={slotH}
              fullWidth={true}
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
