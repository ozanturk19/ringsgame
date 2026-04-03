import { useState } from 'react'
import { HomeScreen } from './screens/HomeScreen'
import { LevelMap } from './screens/LevelMap'
import { GameScreen } from './screens/GameScreen'
import { useProgressStore } from './store/progressStore'
import type { Screen } from './types'
import './index.css'

export default function App() {
  const { currentLevel, isLevelUnlocked } = useProgressStore()
  const [screen, setScreen] = useState<Screen>('home')
  const [activeLevel, setActiveLevel] = useState(currentLevel)

  function goToGame(levelId: number) {
    if (!isLevelUnlocked(levelId)) return
    setActiveLevel(levelId)
    setScreen('game')
  }

  function goToNextLevel(nextId: number) {
    if (isLevelUnlocked(nextId)) {
      goToGame(nextId)
    } else {
      setScreen('levelMap')
    }
  }

  return (
    <div className="game-bg">
      {screen === 'home' && (
        <HomeScreen
          onPlay={() => goToGame(currentLevel || 1)}
          onMap={() => setScreen('levelMap')}
        />
      )}

      {screen === 'levelMap' && (
        <LevelMap
          onSelectLevel={goToGame}
          onBack={() => setScreen('home')}
        />
      )}

      {screen === 'game' && (
        <GameScreen
          levelId={activeLevel}
          onBack={() => setScreen('levelMap')}
          onNextLevel={goToNextLevel}
        />
      )}
    </div>
  )
}
