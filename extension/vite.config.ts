import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// App build: React side panel (HTML entry) + background service worker (ESM).
// The content script is built separately by vite.content.config.ts because
// Chrome loads content scripts as CLASSIC scripts (no import statements).
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@studylens/shared': resolve(__dirname, '../shared/src/index.ts'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true, // this pass runs FIRST and cleans dist
    rollupOptions: {
      input: {
        sidepanel: resolve(__dirname, 'src/sidepanel/index.html'),
        background: resolve(__dirname, 'src/background/service-worker.ts'),
      },
      output: {
        format: 'es',
        entryFileNames: (chunk) => (chunk.name === 'background' ? 'background.js' : '[name].js'),
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
});