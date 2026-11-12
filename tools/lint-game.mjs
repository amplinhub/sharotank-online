/* Lints the joined game (one scope) — per-file linting can't see cross-file declarations. */
import { ESLint } from 'eslint';
import globals from 'globals';
import { joinGame } from './vite-game-concat.js';
const { code } = joinGame(new URL('../src/game', import.meta.url).pathname);
const lint = new ESLint({ overrideConfigFile: true, overrideConfig: { languageOptions: { ecmaVersion: 2022, sourceType: 'module', globals: { ...globals.browser, THREE: 'readonly' } },
  rules: { 'no-undef': 'error', 'no-dupe-keys': 'error', 'no-redeclare': 'error', 'no-const-assign': 'error', 'no-unreachable': 'warn', 'no-self-assign': 'warn', 'no-dupe-else-if': 'error', 'no-unused-vars': ['warn', { vars: 'local', args: 'none' }] } } });
const [r] = await lint.lintText(code, { filePath: 'game.joined.js' });
const errs = r.messages.filter(m => m.severity === 2);
for (const m of r.messages.slice(0, 60)) console.log(`${m.severity === 2 ? 'ERR ' : 'warn'} ${m.line}:${m.column} ${m.message}`);
console.log(`${errs.length} errors, ${r.messages.length - errs.length} warnings`);
process.exit(errs.length ? 1 : 0);
