import { useEffect, useRef } from 'react'

interface TutorialOverlayProps {
  message: string
  visible: boolean
  onDismiss: () => void
  position?: 'top' | 'bottom'
}

export function TutorialOverlay({ message, visible, onDismiss, position = 'bottom' }: TutorialOverlayProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Auto-dismiss after 4 seconds
  useEffect(() => {
    if (visible) {
      timerRef.current = setTimeout(() => {
        onDismiss()
      }, 4000)
    }
    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [visible, message, onDismiss])

  const isBottom = position === 'bottom'

  return (
    // Backdrop: pointer-events-none so game tubes remain tappable
    <div
      className={[
        'fixed inset-0 z-40 pointer-events-none flex flex-col justify-end',
        isBottom ? 'items-center justify-end pb-24' : 'items-center justify-start pt-24',
      ].join(' ')}
      aria-hidden={!visible}
    >
      {/* Card: pointer-events-auto so the dismiss button works */}
      <div
        className="pointer-events-auto mx-4 max-w-sm w-full"
        style={{
          transform: visible ? 'translateY(0)' : 'translateY(24px)',
          opacity: visible ? 1 : 0,
          transition: 'transform 350ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 300ms ease',
        }}
        onClick={onDismiss}
      >
        <div
          className="rounded-2xl px-5 py-4 flex items-start gap-3"
          style={{
            background: 'rgba(15, 15, 35, 0.92)',
            border: '1px solid rgba(255,255,255,0.12)',
            backdropFilter: 'blur(16px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          }}
        >
          {/* Pulsing dot indicator */}
          <div className="flex-shrink-0 mt-0.5">
            <div
              className="w-3 h-3 rounded-full"
              style={{
                background: '#10b981',
                boxShadow: '0 0 0 0 rgba(16,185,129,0.6)',
                animation: 'tutorial-pulse 1.5s infinite',
              }}
            />
          </div>

          {/* Message text */}
          <p className="flex-1 text-white font-semibold text-sm leading-snug">
            {message}
          </p>

          {/* Dismiss button */}
          <button
            onClick={(e) => { e.stopPropagation(); onDismiss() }}
            className="flex-shrink-0 text-xs font-bold px-3 py-1.5 rounded-xl active:scale-95 transition-transform duration-100"
            style={{
              background: 'rgba(16,185,129,0.2)',
              border: '1px solid rgba(16,185,129,0.4)',
              color: '#34d399',
            }}
          >
            Tamam
          </button>
        </div>
      </div>

      <style>{`
        @keyframes tutorial-pulse {
          0%   { box-shadow: 0 0 0 0 rgba(16,185,129,0.6); }
          70%  { box-shadow: 0 0 0 8px rgba(16,185,129,0); }
          100% { box-shadow: 0 0 0 0 rgba(16,185,129,0); }
        }
      `}</style>
    </div>
  )
}
