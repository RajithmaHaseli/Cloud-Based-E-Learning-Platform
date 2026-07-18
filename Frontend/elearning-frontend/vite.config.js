import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    host: true,
  },
  // Work around rolldown native-binding issues on Windows.
  // Force Vite to use esbuild for minification.
  build: {
    minify: "esbuild",
  },
})


