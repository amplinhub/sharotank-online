import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import path from 'node:path';
import gameConcat from './tools/vite-game-concat.js';

/* `vite build`                → dist/         (GitHub Pages, several files)
   `vite build --mode single`  → dist-single/  (one self-contained index.html: local file + Claude artifact)
   `vite build --mode offline` → dist-offline/ (one file, offline edition for the amplinhub/sharotank repo:
                                 no «С другом», «Водители», «Отладка» — <html class="offline">, flag OFFLINE in 10) */
const offlineHtml = () => ({ name: 'offline-html', transformIndexHtml: h => h.replace('<html lang="ru">', '<html lang="ru" class="offline">')
  .replace('<title>Шаротанк Онлайн</title>', '<title>Шаротанк</title>').replace('<h1>Шаротанк <em>Онлайн</em></h1>', '<h1>Шаротанк</h1>') });
export default defineConfig(({ mode }) => ({
  base: './',
  resolve: { alias: { '@lib': path.resolve('src/lib') } }, // настоящие модули, которые склейка игры импортирует (см. src/game/imports.mjs)
  plugins: [gameConcat(), ...(mode !== 'production' ? [viteSingleFile()] : []), ...(mode === 'offline' ? [offlineHtml()] : [])],
  build: {
    outDir: mode === 'single' ? 'dist-single' : mode === 'offline' ? 'dist-offline' : 'dist',
    target: 'es2020',
    sourcemap: mode === 'production',
    chunkSizeWarningLimit: 2000
  },
  server: { host: true }
}));
