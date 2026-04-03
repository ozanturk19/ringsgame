import { useState, useCallback } from 'react'
import type { Screen } from '../types'

export function useScreenTransition(initial: Screen) {
  const [screen, setScreen] = useState<Screen>(initial)
  const [exiting, setExiting] = useState(false)

  const navigate = useCallback((to: Screen) => {
    setExiting(true)
    setTimeout(() => {
      setScreen(to)
      setExiting(false)
    }, 140)
  }, [])

  return { screen, navigate, exiting }
}
