import { useState, useEffect } from 'react'
import { HomeScreen } from './screens/HomeScreen'
import { LevelMap } from './screens/LevelMap'
import { GameScreen } from './screens/GameScreen'
import { DailyScreen } from './screens/DailyScreen'
import { StatsScreen } from './screens/StatsScreen'
import { ErrorBoundary } from './components/ErrorBoundary'
import { useProgressStore } from './store/progressStore'
import { useScreenTransition } from './hooks/useScreenTransition'
import { useThemeStore } from './store/themeStore'
import type { Screen } from './types'
import './index.css'

export default function App() {
  const { currentLevel, isLevelUnlocked } = useProgressStore()
  const { screen, navigate, exiting } = useScreenTransition('home')
  const [activeLevel, setActiveLevel] = useState(currentLevel || 1)
  const { theme } = useThemeStore()

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  function goToGame(levelId: number) {
    if (!isLevelUnlocked(levelId)) return
    setActiveLevel(levelId)
    navigate('game')
  }

  function goToNextLevel(nextId: number) {
    if (isLevelUnlocked(nextId)) {
      goToGame(nextId)
    } else {
      navigate('levelMap')
    }
  }

  const transitionClass = exiting ? 'screen-exit' : 'screen-enter'

  return (
    <ErrorBoundary>
      <div className="game-bg">
        {screen === 'home' && (
          <div key="home" className={transitionClass}>
            <HomeScreen
              onPlay={() => goToGame(currentLevel || 1)}
              onMap={() => navigate('levelMap')}
              onDaily={() => navigate('daily' as Screen)}
              onStats={() => navigate('stats')}
            />
          </div>
        )}
        {screen === 'levelMap' && (
          <div key="levelMap" className={transitionClass}>
            <LevelMap
              onSelectLevel={goToGame}
              onBack={() => navigate('home')}
            />
          </div>
        )}
        {screen === 'game' && (
          <div key="game" className={transitionClass}>
            <GameScreen
              levelId={activeLevel}
              onBack={() => navigate('levelMap')}
              onNextLevel={goToNextLevel}
            />
          </div>
        )}
        {(screen as string) === 'daily' && (
          <div key="daily" className={transitionClass}>
            <DailyScreen onBack={() => navigate('home')} />
          </div>
        )}
        {screen === 'stats' && (
          <div key="stats" className={transitionClass}>
            <StatsScreen onBack={() => navigate('home')} />
          </div>
        )}
      </div>
    </ErrorBoundary>
  )
}
