import { useEffect } from 'react'
import { useGameStore } from '../store/gameStore'
import { getMoveCount, calculateStars } from '../game/engine'
import { getLevel } from '../game/levels'
import { Tube } from '../components/Tube'
import { TopBar } from '../components/TopBar'
import { BottomBar } from '../components/BottomBar'
import { WinOverlay } from '../components/WinOverlay'
import { ANIM } from '../constants/animations'

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

  useEffect(() => {
    loadLevel(levelId)
  }, [levelId])

  if (!gameState) return null

  const moveCount = getMoveCount(gameState)
  const level = getLevel(levelId)
  const stars = phase === 'LEVEL_COMPLETE'
    ? calculateStars(moveCount, level?.optimalMoves ?? moveCount)
    : 0

  const tubes = gameState.tubes
  const tubeCount = tubes.length

  // Responsive tube size
  const tubeSize = tubeCount <= 5 ? 'lg' : tubeCount <= 7 ? 'md' : 'sm'

  // Layout: wrap at 5 tubes for small screens
  const needsWrap = tubeCount > 6

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar levelId={levelId} moveCount={moveCount} onBack={onBack} />

      {/* Game area */}
      <div className="flex-1 flex items-center justify-center px-2 py-4">
        <div
          className={[
            'flex items-end justify-center gap-3',
            needsWrap ? 'flex-wrap max-w-sm' : '',
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
              onClick={(idx) => {
                clearHint()
                selectTube(idx)
              }}
              entranceDelay={i * ANIM.LEVEL_ENTRANCE_STAGGER}
              size={tubeSize}
            />
          ))}
        </div>
      </div>

      <BottomBar
        canUndo={gameState.undoStack.length > 0}
        onUndo={undo}
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
