import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import path from 'node:path';
import gameConcat from './tools/vite-game-concat.js';

/* `vite build`                → dist/        (GitHub Pages, several files)
   `vite build --mode single`  → dist-single/ (one self-contained index.html: local file + Claude artifact) */
export default defineConfig(({ mode }) => ({
  base: './',
  resolve: { alias: { '@lib': path.resolve('src/lib') } }, // настоящие модули, которые склейка игры импортирует (см. src/game/imports.mjs)
  plugins: [gameConcat(), ...(mode === 'single' ? [viteSingleFile()] : [])],
  build: {
    outDir: mode === 'single' ? 'dist-single' : 'dist',
    target: 'es2020',
    sourcemap: mode !== 'single',
    chunkSizeWarningLimit: 2000
  },
  server: { host: true }
}));
