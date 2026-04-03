import { create } from 'zustand'

export type ThemeId = 'default' | 'pastel' | 'highcontrast'

const THEME_KEY = 'halka-theme-v1'

interface ThemeStore {
  theme: ThemeId
  setTheme: (t: ThemeId) => void
}

export const useThemeStore = create<ThemeStore>((set) => ({
  theme: (localStorage.getItem(THEME_KEY) as ThemeId) || 'default',
  setTheme(t) {
    localStorage.setItem(THEME_KEY, t)
    document.documentElement.setAttribute('data-theme', t)
    set({ theme: t })
  },
}))
