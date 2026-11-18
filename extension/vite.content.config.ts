import { defineConfig } from 'vite';
import { resolve } from 'path';

// Content-script build: ONE input, IIFE output, everything inlined.
// Result: dist/content.js is a single self-contained classic script.
export default defineConfig({
  resolve: {
    alias: {
      '@studylens/shared': resolve(__dirname, '../shared/src/index.ts'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: false, // MUST NOT wipe the app build output
    copyPublicDir: false, // manifest already copied by the app build
    lib: {
      entry: resolve(__dirname, 'src/content/selection.ts'),
      formats: ['iife'],
      name: 'StudyLensContent',
      fileName: () => 'content.js',
    },
    minify: 'esbuild',
  },
});