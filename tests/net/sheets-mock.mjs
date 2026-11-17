/* Мок веб-приложения Apps Script для тестов «Водителей»: та же логика (server/sheets/core.js), таблицы в памяти.
   const sh = await startSheets(); страница получает адрес через window.SHT_NET_CFG.sheets = sh.url; … await sh.close(); */
import http from 'node:http';
import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';
import { ROOT } from '../harness.mjs';

export function loadCore() {
  const ctx = vm.createContext({ Math, Date, JSON, Object, String, Number, isFinite });
  vm.runInContext(fs.readFileSync(ROOT + '/server/sheets/core.js', 'utf8'), ctx);
  return ctx;
}
export function memDb(cols) {
  const T = {}; for (const t of Object.keys(cols)) T[t] = [];
  return { T, rows: t => T[t], append: (t, o) => { o._r = T[t].length + 2; T[t].push(o); }, update: () => {} };
}
export const sha = s => crypto.createHash('sha256').update(s, 'utf8').digest('hex');

export async function startSheets() {
  const core = loadCore(), db = memDb(core.SH_COLS); let calls = 0, delay = 0;
  const srv = http.createServer((req, res) => {
    const u = new URL(req.url, 'http://x'), p = Object.fromEntries(u.searchParams); calls++;
    const out = JSON.stringify(core.shHandle(db, p, Date.now(), sha));
    setTimeout(() => { res.writeHead(200, { 'content-type': 'application/json', 'access-control-allow-origin': '*' }); res.end(out); }, delay);
  });
  await new Promise(r => srv.listen(0, '127.0.0.1', r));
  const url = `http://127.0.0.1:${srv.address().port}/exec`;
  return { url, db, get calls() { return calls; }, setDelay: d => { delay = d; }, close: () => new Promise(r => { srv.close(() => r()); srv.closeAllConnections?.(); }) };
}
