import { useState, useEffect } from 'react'
import { useGameStore } from '../store/gameStore'
import { getMoveCount } from '../game/engine'

const TUTORIAL_KEY = 'halka-tutorial-done-v1'

function isTutorialDone(): boolean {
  try {
    return localStorage.getItem(TUTORIAL_KEY) === '1'
  } catch {
    return false
  }
}

function markTutorialDone() {
  try {
    localStorage.setItem(TUTORIAL_KEY, '1')
  } catch {
    // ignore
  }
}

// Messages per level per step
const MESSAGES: Record<number, string[]> = {
  1: [
    'Bir tüpe dokun ve halkayı seç!',
    'Şimdi başka bir tüpe dokun ve halkayı taşı!',
    'Harika! Aynı renkleri aynı tüpte topla.',
  ],
  2: [
    'Sıralamayı planla — büyük halkalar alta gitmeli.',
    'Bu hamle geçersiz. Başka bir yol dene!',
  ],
  3: [
    'İpucu: Önce tüpleri temizle, sonra renkleri birleştir.',
  ],
}

export function useTutorial(levelId: number): { message: string | null; dismiss: () => void } {
  const [step, setStep] = useState(0)
  const [dismissed, setDismissed] = useState(false)
  const [tutorialDone, setTutorialDone] = useState(isTutorialDone)

  const { gameState, phase, selectedTubeIndex } = useGameStore()

  // Reset step and dismissed state when level changes
  useEffect(() => {
    setStep(0)
    setDismissed(false)
  }, [levelId])

  // Level 1 step progression
  useEffect(() => {
    if (levelId !== 1 || tutorialDone || dismissed) return

    if (step === 0 && selectedTubeIndex !== null) {
      // First tube selected
      setStep(1)
    }
  }, [selectedTubeIndex, levelId, tutorialDone, dismissed, step])

  useEffect(() => {
    if (levelId !== 1 || tutorialDone || dismissed) return

    const moveCount = gameState ? getMoveCount(gameState) : 0
    if (step === 1 && moveCount >= 1) {
      // First move made
      setStep(2)
    }
  }, [gameState, levelId, tutorialDone, dismissed, step])

  // Level 2: show invalid move hint after invalid shake
  useEffect(() => {
    if (levelId !== 2 || tutorialDone || dismissed) return

    if (step === 0 && phase === 'INVALID_SHAKE') {
      setStep(1)
    }
  }, [phase, levelId, tutorialDone, dismissed, step])

  // Mark tutorial done when level 3 completes
  useEffect(() => {
    if (levelId === 3 && phase === 'LEVEL_COMPLETE') {
      markTutorialDone()
      setTutorialDone(true)
    }
  }, [levelId, phase])

  const dismiss = () => setDismissed(true)

  if (levelId > 3 || tutorialDone || dismissed) {
    return { message: null, dismiss }
  }

  const messages = MESSAGES[levelId]
  if (!messages) return { message: null, dismiss }

  const message = messages[step] ?? null
  return { message, dismiss }
}
