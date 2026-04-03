import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { readFileSync, writeFileSync } from 'fs'
import type { Plugin } from 'vite'

// Build tamamlanınca sw.js içindeki CACHE versiyonunu günceller
function swVersionPlugin(): Plugin {
  return {
    name: 'sw-version',
    closeBundle() {
      try {
        const swPath = 'dist/sw.js'
        const hash = Date.now().toString(36)
        let sw = readFileSync(swPath, 'utf8')
        sw = sw.replace(/halka-v\d+/g, `halka-v${hash}`)
        writeFileSync(swPath, sw)
        console.log(`[sw-version] Cache key: halka-v${hash}`)
      } catch {
        // sw.js yoksa (dev mode) sessizce geç
      }
    },
  }
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    swVersionPlugin(),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    exclude: ['node_modules', 'e2e/**'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      include: ['src/game/**'],
    },
  },
} as any)

