import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@studylens/shared': resolve(__dirname, '../shared/src/index.ts'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        sidepanel: resolve(__dirname, 'src/sidepanel/index.html'),
        content: resolve(__dirname, 'src/content/selection.ts'),
        background: resolve(__dirname, 'src/background/service-worker.ts'),
      },
      output: {
        entryFileNames: '[name].js',
      },
    },
  },
});