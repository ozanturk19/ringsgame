import { useState, useEffect, lazy, Suspense } from 'react'
import { HomeScreen } from './screens/HomeScreen'
import { GameScreen } from './screens/GameScreen'
// Lazy load these:
const LevelMap = lazy(() => import('./screens/LevelMap').then(m => ({ default: m.LevelMap })))
const DailyScreen = lazy(() => import('./screens/DailyScreen').then(m => ({ default: m.DailyScreen })))
const StatsScreen = lazy(() => import('./screens/StatsScreen').then(m => ({ default: m.StatsScreen })))
const TimedModeScreen = lazy(() => import('./screens/TimedModeScreen').then(m => ({ default: m.TimedModeScreen })))
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
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="text-white/40 text-sm">Yükleniyor...</div></div>}>
      <div className="game-bg">
        {screen === 'home' && (
          <div key="home" className={transitionClass} style={{ width: '100%' }}>
            <HomeScreen
              onPlay={() => goToGame(currentLevel || 1)}
              onMap={() => navigate('levelMap')}
              onDaily={() => navigate('daily' as Screen)}
              onStats={() => navigate('stats')}
              onTimed={() => navigate('timed')}
            />
          </div>
        )}
        {screen === 'levelMap' && (
          <div key="levelMap" className={transitionClass} style={{ width: '100%' }}>
            <LevelMap
              onSelectLevel={goToGame}
              onBack={() => navigate('home')}
            />
          </div>
        )}
        {screen === 'game' && (
          <div key="game" className={transitionClass} style={{ width: '100%' }}>
            <GameScreen
              levelId={activeLevel}
              onBack={() => navigate('levelMap')}
              onNextLevel={goToNextLevel}
            />
          </div>
        )}
        {(screen as string) === 'daily' && (
          <div key="daily" className={transitionClass} style={{ width: '100%' }}>
            <DailyScreen onBack={() => navigate('home')} />
          </div>
        )}
        {screen === 'stats' && (
          <div key="stats" className={transitionClass} style={{ width: '100%' }}>
            <StatsScreen onBack={() => navigate('home')} />
          </div>
        )}
        {screen === 'timed' && (
          <div key="timed" className={transitionClass} style={{ width: '100%' }}>
            <TimedModeScreen onBack={() => navigate('home')} />
          </div>
        )}
      </div>
      </Suspense>
    </ErrorBoundary>
  )
}
