import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],

  // Required for @mediapipe/tasks-vision WASM — do not let Vite pre-bundle it
  optimizeDeps: {
    exclude: ['@mediapipe/tasks-vision'],
  },

  server: {
    host: '127.0.0.1',
    port: 5173,
    proxy: {
      '/health': 'http://127.0.0.1:8000',
      '/system': 'http://127.0.0.1:8000',
      '/ws': { target: 'ws://127.0.0.1:8000', ws: true },
    },
    // SharedArrayBuffer required by MediaPipe WASM (dev server)
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },

  build: {
    rolldownOptions: {
      output: {
        // Split vendor chunks to stay under Vercel's 500 kB warning threshold
        // Rolldown (Vite 8) requires manualChunks as a function, not an object
        manualChunks: (id: string) => {
          if (id.includes('node_modules/three') || id.includes('@react-three')) {
            return 'three-vendor'
          }
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'react-vendor'
          }
          if (id.includes('node_modules/framer-motion')) {
            return 'framer-vendor'
          }
        },
      },
    },
  },
})
