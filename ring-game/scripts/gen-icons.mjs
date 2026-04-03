import sharp from 'sharp'
import { mkdir } from 'fs/promises'
import { existsSync } from 'fs'

// Oyunun temasına uygun SVG ikonu (daha büyük canvas)
function makeSvg(size) {
  const s = size
  const cx = s / 2
  const r = s * 0.22     // tube half-width
  const rx = s * 0.09    // ring x-radius
  const ry = s * 0.045   // ring y-radius
  const sw = s * 0.078   // stroke-width

  const rings = [
    { cy: s * 0.175, color: '#EAB308' }, // yellow
    { cy: s * 0.375, color: '#EF4444' }, // red
    { cy: s * 0.575, color: '#22C55E' }, // green
    { cy: s * 0.775, color: '#3B82F6' }, // blue
  ]

  const rr = Math.round(s * 0.2) // border-radius

  const ringsSvg = rings.map(({ cy, color }) => `
    <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"
      fill="none" stroke="${color}" stroke-width="${sw}"
      stroke-linecap="round" opacity="0.95"/>
  `).join('')

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${s} ${s}" width="${s}" height="${s}">
    <rect width="${s}" height="${s}" rx="${rr}" fill="#0f0f23"/>
    <rect x="${cx - r}" y="${s * 0.08}" width="${r * 2}" height="${s * 0.84}"
      rx="${r}" fill="rgba(255,255,255,0.07)"
      stroke="rgba(255,255,255,0.18)" stroke-width="${s * 0.012}"/>
    ${ringsSvg}
    <ellipse cx="${cx - rx * 0.3}" cy="${rings[0].cy - ry * 0.2}"
      rx="${rx * 0.28}" ry="${ry * 0.27}" fill="white" opacity="0.3"/>
  </svg>`
}

const dir = 'public/icons'
if (!existsSync(dir)) await mkdir(dir, { recursive: true })

for (const size of [192, 512]) {
  const svg = Buffer.from(makeSvg(size))
  await sharp(svg)
    .png()
    .toFile(`${dir}/icon-${size}.png`)
  console.log(`✓ icon-${size}.png`)
}

console.log('İkonlar hazır: public/icons/')
