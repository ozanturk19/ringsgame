/**
 * Sound system using Web Audio API.
 * Generates sounds procedurally — no audio files needed.
 * Respects user's mute preference stored in localStorage.
 */

import { useCallback, useRef } from 'react'

type SoundType = 'pick' | 'place' | 'invalid' | 'win' | 'star'

const MUTE_KEY = 'halka-mute-v1'

function isMuted(): boolean {
  try { return localStorage.getItem(MUTE_KEY) === '1' } catch { return false }
}

export function setMuted(v: boolean) {
  try { localStorage.setItem(MUTE_KEY, v ? '1' : '0') } catch { /* ignore */ }
}

export function getMuted(): boolean { return isMuted() }

function vibrate(pattern: number | number[]) {
  try {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(pattern)
    }
  } catch { /* ignore */ }
}

let sharedCtx: AudioContext | null = null

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  try {
    if (!sharedCtx) sharedCtx = new AudioContext()
    if (sharedCtx.state === 'suspended') sharedCtx.resume()
    return sharedCtx
  } catch {
    return null
  }
}

function playTone(
  ctx: AudioContext,
  type: OscillatorType,
  freq: number,
  gainVal: number,
  duration: number,
  freqEnd?: number,
) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.connect(gain)
  gain.connect(ctx.destination)

  osc.type = type
  osc.frequency.setValueAtTime(freq, ctx.currentTime)
  if (freqEnd !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(freqEnd, ctx.currentTime + duration)
  }

  gain.gain.setValueAtTime(gainVal, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)

  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + duration)
}

function playPick(ctx: AudioContext) {
  playTone(ctx, 'sine', 520, 0.12, 0.08, 620)
}

function playPlace(ctx: AudioContext) {
  playTone(ctx, 'sine', 440, 0.14, 0.1, 380)
  setTimeout(() => playTone(ctx, 'sine', 660, 0.08, 0.06), 60)
}

function playInvalid(ctx: AudioContext) {
  playTone(ctx, 'square', 180, 0.08, 0.12, 140)
}

function playWin(ctx: AudioContext) {
  const notes = [523, 659, 784, 1047]
  notes.forEach((freq, i) => {
    setTimeout(() => {
      playTone(ctx, 'sine', freq, 0.15, 0.25)
    }, i * 100)
  })
}

function playStar(ctx: AudioContext) {
  playTone(ctx, 'triangle', 880, 0.1, 0.15, 1100)
}

const SOUND_FNS: Record<SoundType, (ctx: AudioContext) => void> = {
  pick: playPick,
  place: playPlace,
  invalid: playInvalid,
  win: playWin,
  star: playStar,
}

export function useSound() {
  const mutedRef = useRef(isMuted())

  const play = useCallback((sound: SoundType) => {
    if (mutedRef.current) return
    const ctx = getCtx()
    if (!ctx) return
    try { SOUND_FNS[sound](ctx) } catch { /* ignore */ }
    if (sound === 'pick') vibrate(10)
    else if (sound === 'place') vibrate([10, 20, 15])
    else if (sound === 'invalid') vibrate([30, 20, 30])
    else if (sound === 'win') vibrate([50, 30, 80, 30, 120])
    else if (sound === 'star') vibrate(20)
  }, [])

  const toggleMute = useCallback(() => {
    mutedRef.current = !mutedRef.current
    setMuted(mutedRef.current)
    return mutedRef.current
  }, [])

  return { play, toggleMute, isMuted: () => mutedRef.current }
}
