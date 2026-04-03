import { useEffect, useRef } from 'react'
import { useGameStore } from '../store/gameStore'
import { getMoveCount, calculateStars, isTubeComplete } from '../game/engine'
import { getLevel } from '../game/levels'
import { Tube } from '../components/Tube'
import { TopBar } from '../components/TopBar'
import { BottomBar } from '../components/BottomBar'
import { WinOverlay } from '../components/WinOverlay'
import { ANIM } from '../constants/animations'
import { useSound } from '../hooks/useSound'

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
    loadLevel,
    selectTube,
    undo,
    reset,
    useHint,
    clearHint,
  } = useGameStore()

  const { play } = useSound()
  const prevMoveCount = useRef(0)
  const prevPhase = useRef(phase)

  // Load level on mount / levelId change
  useEffect(() => {
    loadLevel(levelId)
    prevMoveCount.current = 0
  }, [levelId])

  // Sound reactions to state changes
  useEffect(() => {
    if (!gameState) return
    const moves = getMoveCount(gameState)

    if (phase === 'TUBE_SELECTED' && prevPhase.current === 'IDLE') {
      play('pick')
    }
    if (moves > prevMoveCount.current) {
      play('place')
      prevMoveCount.current = moves
    }
    if (phase === 'INVALID_SHAKE') {
      play('invalid')
    }
    if (phase === 'LEVEL_COMPLETE' && prevPhase.current !== 'LEVEL_COMPLETE') {
      play('win')
    }
    prevPhase.current = phase
  }, [phase, gameState])

  if (!gameState) return null

  const moveCount = getMoveCount(gameState)
  const level = getLevel(levelId)
  const stars = phase === 'LEVEL_COMPLETE'
    ? calculateStars(moveCount, level?.optimalMoves ?? moveCount)
    : 0

  const tubes = gameState.tubes
  const tubeCount = tubes.length

  // Responsive tube sizing
  const tubeSize = tubeCount <= 5 ? 'lg' : tubeCount <= 7 ? 'md' : 'sm'

  // Wrap into 2 rows for 7+ tubes on small screens
  const needsWrap = tubeCount >= 7

  // Find which tube most recently got a ring (for settle animation)
  const lastMove = gameState.moves.at(-1)
  const newestTubeIdx = lastMove?.toTube ?? -1
  const newestRingIdx = newestTubeIdx >= 0 ? tubes[newestTubeIdx].rings.length - 1 : -1

  return (
    <div className="min-h-screen flex flex-col select-none">
      <TopBar levelId={levelId} moveCount={moveCount} onBack={onBack} />

      {/* Game area */}
      <div className="flex-1 flex items-center justify-center px-3 py-6 overflow-hidden">
        <div
          className={[
            'flex items-end justify-center',
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
              onClick={(idx) => {
                clearHint()
                selectTube(idx)
              }}
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
      />

      {phase === 'LEVEL_COMPLETE' && (
        <WinOverlay
          levelId={levelId}
          stars={stars}
          moveCount={moveCount}
          onNext={() => onNextLevel(levelId + 1)}
          onMap={onBack}
          onReplay={() => loadLevel(levelId)}
        />
      )}
    </div>
  )
}
