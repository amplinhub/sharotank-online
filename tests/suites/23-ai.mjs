/* v30.4: robots use cover («Бизон», «Каток») and do little things at rest (looks only). */
import { client } from '../harness.mjs';
const assert = (c, m) => { if (!c) throw new Error(m); };

async function field(ctx, name) {
  const c = await client({ name }); ctx.clients.push(c);
  await c.js(() => __dbg.goLocation('junk', 'N')); await c.until(() => !__dbg.transit && __dbg.LOC === 'junk', null, { timeout: 30000 }); await c.wait(500);
  await c.js(() => { const D = __dbg; for (const e of D.ENEMIES) if (!e.dead) D.eRemove(e); Object.assign(D.TK, { x: 80, z: 60, vx: 0, vz: 0, hp: 99999 }); });
  return c;
}
export const tests = [
  { name: 'ai: «Бизон» hides behind a wall, peeks to fire, finds new cover when the wall is gone', timeout: 150, async run(ctx) {
    const c = await field(ctx, 'ai-bull');
    // an open patch: tank at (80,60), a 12 m wall 18 m north of it, the bull in the open beside the wall's end (it sees the tank)
    await c.js(() => { const D = __dbg; D.dbgWall(74, 78, 86, 79, 2.6); const e = D.spawnEnemy('bull', 66, 79); e.mod = 'mg'; e.hp = e.maxHp = 99999; window.__b = e; e.aggro = true; e.last = { x: D.TK.x, z: D.TK.z }; });
    const seen = new Set(); let hidLos = 0, firedLos = 0;
    for (let i = 0; i < 160 && !(seen.has('hide') && seen.has('peek') && seen.has('fire') && seen.size > 4 && i > 60); i++) {
      const r = await c.js(() => { const e = window.__b; return { st: e.state }; });
      seen.add(r.st); await c.wait(150);
    }
    assert(seen.has('tocover') || seen.has('hide'), 'never went to cover: ' + [...seen]);
    assert(seen.has('hide') && seen.has('peek') && (seen.has('fire') || seen.has('laser')), 'cover cycle incomplete: ' + [...seen]);
    // blow the wall away: it must leave that spot and look for another cover / fight
    await c.js(() => { const D = __dbg; for (let x = 74; x <= 86; x += 1.5) D.explode(x, 1, 78.5, 2.4, 3, 0, 1, 0, 'shell', null, 0, null, 0); });
    const moved = await c.until(() => { const e = window.__b; return !e.cov || e.state === 'move' || e.state === 'tocover' ? e.state : null; }, null, { timeout: 8000 });
    assert(moved, 'did not react to the broken cover');
    void hidLos; void firedLos;
  } },
  { name: 'ai: «Каток» turns its front to a flanking tank', timeout: 120, async run(ctx) {
    const c = await field(ctx, 'ai-katok');
    await c.js(() => { const D = __dbg, e = D.spawnEnemy('katok', 80, 74); e.hp = e.maxHp = 99999; e.h = 0; e.aggro = true; e.fcd = 99; window.__k = e; Object.assign(D.TK, { x: 92, z: 74 }); });
    // tank sits 12 m to the katok's side: within ~5 s the hull must face it (front ±35°)
    const ok = await c.until(() => { const D = __dbg, e = window.__k, want = Math.atan2(D.TK.x - e.x, D.TK.z - e.z); let a = want - e.h; a = Math.atan2(Math.sin(a), Math.cos(a)); return Math.abs(a) < 0.6 ? a : null; }, null, { timeout: 9000 });
    assert(ok !== null, 'katok kept its side to the tank');
  } },
  { name: 'ai: little things at rest — activities start, stop on alarm, limited count', timeout: 150, async run(ctx) {
    const c = await field(ctx, 'ai-life');
    await c.js(() => { const D = __dbg; Object.assign(D.TK, { x: 20, z: 20 }); window.__L = []; for (let i = 0; i < 8; i++) { const e = D.spawnEnemy(i % 2 ? 'jian' : 'bull', 40 + (i % 4) * 5, 40 + Math.floor(i / 4) * 6); e.aggro = false; e.sees = false; window.__L.push(e); } });
    const kinds = new Set(); let maxBusy = 0;
    for (let i = 0; i < 80; i++) {
      const r = await c.js(() => { const D = __dbg; for (const e of window.__L) { e.sees = false; e.aggro = false; e.lostT = 99; } if (window.__L[0].act == null && D.lifeBusy() < 6) { for (const e of window.__L) if (!e.act) D.lifeTry(e); } return { b: D.lifeBusy(), k: window.__L.map(e => e.act && e.act.k).filter(Boolean) }; });
      r.k.forEach(k => kinds.add(k)); maxBusy = Math.max(maxBusy, r.b); await c.wait(150);
    }
    assert(kinds.size >= 3, 'too few activities seen: ' + [...kinds]);
    assert(maxBusy <= 6, 'more than 6 busy robots: ' + maxBusy);
    // alarm: everyone drops what they do at once
    await c.js(() => { const D = __dbg; Object.assign(D.TK, { x: 47, z: 47 }); for (const e of window.__L) { e.hurtT = 3; } });
    const calm = await c.until(() => window.__L.every(e => !e.act || e.dead), null, { timeout: 4000 });
    assert(calm, 'activities not dropped on alarm: ' + JSON.stringify(await c.js(() => window.__L.map(e => e.act && e.act.k))));
  } }
];
