import { useEffect, useLayoutEffect, useRef, useState } from 'react'
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

  // Measure actual rendered grid width so tubes never overflow
  const gridRef = useRef<HTMLDivElement>(null)
  const [gridW, setGridW] = useState(0)
  useLayoutEffect(() => {
    const el = gridRef.current
    if (!el) return
    const update = () => setGridW(el.offsetWidth)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

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
  const cols = needsWrap ? Math.ceil(tubeCount / 2) : tubeCount
  const GAP = 4

  // gridW comes from ResizeObserver measuring the actual rendered container.
  // On the very first render (gridW=0) fall back to a safe estimate.
  const effectiveW = gridW > 0 ? gridW : Math.max(document.documentElement.clientWidth - 16, 200)
  const tubeW = Math.floor((effectiveW - GAP * (cols - 1)) / cols)
  const ringW = tubeW - 12   // 6px inner padding each side
  const ringH = Math.round(ringW * 0.47)
  const slotH = ringH + 4

  const lastMove = gameState.moves.at(-1)
  const newestTubeIdx = lastMove?.toTube ?? -1
  const newestRingIdx = newestTubeIdx >= 0 ? tubes[newestTubeIdx].rings.length - 1 : -1

  return (
    <div className="min-h-screen flex flex-col select-none">
      <TopBar levelId={levelId} moveCount={moveCount} onBack={onBack} />

      {/* Game area */}
      <div className="flex-1 flex items-center justify-center px-2 py-4 game-area">
        <div
          ref={gridRef}
          className="tube-grid w-full flex flex-wrap items-end justify-center"
          style={{ gap: GAP, rowGap: slotH * 3 }}
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
              tubeWidth={tubeW}
              ringWidth={ringW}
              ringHeight={ringH}
              slotHeight={slotH}
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
