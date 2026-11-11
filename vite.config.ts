import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

// base './' + singlefile => dist/index.html opens straight from disk (file://)
export default defineConfig({
  base: './',
  plugins: [
    react(),
    viteSingleFile(),
    {
      name: 'drop-unused-sqlite-worker1',
      generateBundle(_options, bundle) {
        for (const name of Object.keys(bundle)) {
          if (name.includes('sqlite3-worker1')) delete bundle[name]
        }
      },
    },
  ],
  build: { assetsInlineLimit: 100_000_000, cssCodeSplit: false },
  worker: { format: 'es' },
  optimizeDeps: { exclude: ['@sqlite.org/sqlite-wasm'] },
})
