/// <reference types="vitest/config" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// El repo se llama "mundial", por lo que GitHub Pages servirá en /mundial/.
// En desarrollo usamos base '/' para que `npm run dev` funcione sin prefijo.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/mundial/' : '/',
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['src/**/*.{test,spec}.ts'],
  },
}))
