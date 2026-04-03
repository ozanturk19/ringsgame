import { useThemeStore, type ThemeId } from '../store/themeStore'

const THEMES: { id: ThemeId; label: string; color: string }[] = [
  { id: 'default',      label: 'Koyu',     color: '#1a1a3e' },
  { id: 'pastel',       label: 'Pastel',   color: '#e8eeff' },
  { id: 'highcontrast', label: 'Kontrast', color: '#000000' },
]

export function ThemePicker() {
  const { theme, setTheme } = useThemeStore()
  return (
    <div className="flex gap-3 items-center justify-center">
      {THEMES.map(t => (
        <button
          key={t.id}
          onClick={() => setTheme(t.id)}
          title={t.label}
          style={{
            width: 28, height: 28,
            borderRadius: '50%',
            background: t.color,
            border: theme === t.id ? '2px solid #10b981' : '2px solid rgba(255,255,255,0.2)',
            boxShadow: theme === t.id ? '0 0 8px rgba(16,185,129,0.6)' : 'none',
            transition: 'all 200ms',
          }}
        />
      ))}
    </div>
  )
}
