import { defineConfig } from 'vite';

// Relative base so the same build works at any GitHub Pages path.
export default defineConfig({
  base: './',
  build: { target: 'es2022', chunkSizeWarningLimit: 900 },
});
