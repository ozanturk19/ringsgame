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

  // Gerçek container genişliğini ölç (window.innerWidth güvenilir değil)
  const gameAreaRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(0)
  useEffect(() => {
    const el = gameAreaRef.current
    if (!el) return
    const update = () => setContainerWidth(el.clientWidth)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

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

  // ── Responsive tube sizing ─────────────────────────────────────────
  const needsWrap = tubeCount > 5
  const numCols = needsWrap ? Math.ceil(tubeCount / 2) : tubeCount
  const gapPx = 8
  // containerWidth: ResizeObserver'dan gelir; 0 ise henüz ölçülmedi (gizle)
  const avail = containerWidth > 0 ? containerWidth : null
  const dynTubeW = avail
    ? Math.min(Math.floor((avail - gapPx * (numCols - 1)) / numCols), 96)
    : 0
  const dynSlotH = Math.max(22, Math.round(dynTubeW * 0.46))
  // ──────────────────────────────────────────────────────────────────

  const lastMove = gameState.moves.at(-1)
  const newestTubeIdx = lastMove?.toTube ?? -1
  const newestRingIdx = newestTubeIdx >= 0 ? tubes[newestTubeIdx].rings.length - 1 : -1

  return (
    <div className="min-h-screen flex flex-col select-none">
      <TopBar levelId={levelId} moveCount={moveCount} onBack={onBack} />

      {/* Game area — ref ile gerçek genişlik ölçülür */}
      <div
        ref={gameAreaRef}
        className="flex-1 flex items-center justify-center py-4 overflow-hidden game-area"
        style={{ width: '100%' }}
      >
        {dynTubeW > 0 && (
          <div
            className="flex items-end justify-center flex-wrap tube-grid"
            style={{
              gap: gapPx,
              rowGap: dynTubeW * 1.3,
              width: numCols * dynTubeW + (numCols - 1) * gapPx,
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
                tubeWidth={dynTubeW}
                slotHeight={dynSlotH}
                newestRingIndex={i === newestTubeIdx ? newestRingIdx : undefined}
              />
            ))}
          </div>
        )}
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
