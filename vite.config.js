import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './', // Cái này CỰC KỲ QUAN TRỌNG để chạy được trên GitHub Pages
})