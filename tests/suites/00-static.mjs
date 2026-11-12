/* Checks that need no browser: source rules learned the hard way. */
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from '../harness.mjs';
const src = d => fs.readdirSync(path.join(ROOT, d)).filter(f => f.endsWith('.js')).map(f => [f, fs.readFileSync(path.join(ROOT, d, f), 'utf8')]);
const assert = (c, m) => { if (!c) throw new Error(m); };

export const tests = [
  { name: 'index.html keeps doctype + mobile viewport', browser: false, run() {
    const h = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
    assert(/^<!doctype html>/i.test(h), 'no <!doctype html> at the top');
    assert(/<meta name="viewport" content="width=device-width/.test(h), 'mobile viewport meta missing (UI becomes tiny on phones)');
    assert(/<title>Шаротанк Онлайн<\/title>/.test(h), 'title must be «Шаротанк Онлайн»');
  } },
  { name: 'enemy fields never reuse projectile-dispatch flags', browser: false, run() {
    /* projUpdate treats any enemy with .rd/.gd/.shd/.bee/.civ as a radar drone / guard drone / shield / bee / civilian.
       A boss storing e.g. e.rd (rise distance) was "killed" by its first hit (v27.3). Only the owners may set them. */
    /* also .halo/.pool: eRemove() removes them from the scene as the street-lamp robot's light (dragon's ring was renamed hring in v27) */
    const enemyFile = /^(2[23]|3[2-6])-/;
    const mk = flags => [new RegExp(`\\be\\.(${flags})\\s*=[^=]`, 'g'), new RegExp(`[{,]\\s*(${flags})\\s*:`, 'g')];
    const bad = [];
    for (const [f, s] of src('src/game')) { if (!enemyFile.test(f)) continue;
      const pats = mk(f.startsWith('22-') ? 'rd|gd|shd|bee|civ' : 'rd|gd|shd|bee|civ|halo|pool');
      for (const re of pats) { let m; while ((m = re.exec(s))) bad.push(`${f}: …${s.slice(Math.max(0, m.index - 24), m.index + 24).replace(/\n/g, ' ')}…`); } }
    assert(!bad.length, 'reserved enemy field set outside its owner:\n    ' + bad.join('\n    '));
  } },
  { name: 'game files are numbered and contiguous', browser: false, run() {
    const fs_ = src('src/game').map(([f]) => f).sort();
    fs_.forEach(f => assert(/^\d\d-[a-z0-9-]+\.js$/.test(f), 'bad game file name ' + f));
  } }
];
