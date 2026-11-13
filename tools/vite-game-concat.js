/* Joins src/game/*.js (sorted by name: 00-…, 01-…) into ONE module with a combined source map.
   Why: the original game is a single strict-mode scope with shared mutable state
   (`let transit`, `let LOC` …). Real ES-module boundaries would need every shared `let`
   moved into a state object first — that migration happens file by file (see CLAUDE.md, «Модули»). */
import fs from 'node:fs';
import path from 'node:path';
import MagicString, { Bundle } from 'magic-string';

const ID = 'virtual:sharotank-game', RID = '\0' + ID;

export function gameFiles(dir) {
  return fs.readdirSync(dir).filter(f => /^\d\d-.+\.js$/.test(f)).sort().map(f => path.join(dir, f));
}

export function joinGame(dir) {
  const b = new Bundle();
  /* imports.mjs — заголовок: import-ы из src/lib (настоящие модули). Не нумерован, поэтому в gameFiles не попадает. */
  const head = path.join(dir, 'imports.mjs');
  if (fs.existsSync(head)) b.addSource({ filename: head, content: new MagicString(fs.readFileSync(head, 'utf8') + '\n') });
  for (const file of gameFiles(dir)) {
    b.addSource({ filename: file, content: new MagicString(fs.readFileSync(file, 'utf8')) });
  }
  return { code: "'use strict';\n" + b.toString(), map: b.generateMap({ hires: true, includeContent: true }) };
}

export default function gameConcat({ dir = 'src/game' } = {}) {
  let root = process.cwd();
  return {
    name: 'sharotank-game-concat',
    configResolved(c) { root = c.root; },
    resolveId(id) { return id === ID ? RID : null; },
    load(id) {
      if (id !== RID) return null;
      const d = path.resolve(root, dir);
      for (const f of gameFiles(d)) this.addWatchFile(f);
      this.addWatchFile(path.join(d, 'imports.mjs'));
      return joinGame(d);
    },
    handleHotUpdate(ctx) {
      if (ctx.file.includes(path.sep + 'game' + path.sep)) { ctx.server.ws.send({ type: 'full-reload' }); return []; }
    }
  };
}
