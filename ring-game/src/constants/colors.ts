import type { ColorId } from '../types'

export interface ColorDef {
  id: ColorId
  label: string
  hex: string
  shine: string
  dark: string
  tailwind: string
}

export const COLORS: Record<ColorId, ColorDef> = {
  red:    { id: 'red',    label: 'Red',    hex: '#EF4444', shine: '#FCA5A5', dark: '#991B1B', tailwind: 'bg-red-500' },
  yellow: { id: 'yellow', label: 'Yellow', hex: '#EAB308', shine: '#FDE047', dark: '#854D0E', tailwind: 'bg-yellow-500' },
  green:  { id: 'green',  label: 'Green',  hex: '#22C55E', shine: '#86EFAC', dark: '#14532D', tailwind: 'bg-green-500' },
  blue:   { id: 'blue',   label: 'Blue',   hex: '#3B82F6', shine: '#93C5FD', dark: '#1E3A5F', tailwind: 'bg-blue-500' },
  purple: { id: 'purple', label: 'Purple', hex: '#A855F7', shine: '#D8B4FE', dark: '#581C87', tailwind: 'bg-purple-500' },
  orange: { id: 'orange', label: 'Orange', hex: '#F97316', shine: '#FDBA74', dark: '#7C2D12', tailwind: 'bg-orange-500' },
  cyan:   { id: 'cyan',   label: 'Cyan',   hex: '#06B6D4', shine: '#67E8F9', dark: '#164E63', tailwind: 'bg-cyan-500' },
  pink:   { id: 'pink',   label: 'Pink',   hex: '#EC4899', shine: '#F9A8D4', dark: '#831843', tailwind: 'bg-pink-500' },
}

export const COLOR_IDS: ColorId[] = ['red', 'yellow', 'green', 'blue', 'purple', 'orange', 'cyan', 'pink']
