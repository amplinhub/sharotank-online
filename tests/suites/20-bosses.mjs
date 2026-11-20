/* Every boss: spawns, takes real shells without dying from them, dies with the death sequence, bar hides. */
import { client, toBoss, shellAt } from '../harness.mjs';
const assert = (c, m) => { if (!c) throw new Error(m); };
const BOSSES = [
  { type: 'krot', loc: 'junk', side: 'N', mission: 4 },
  { type: 'hornet', loc: 'auto', side: 'E', mission: 9 },
  { type: 'dragon', loc: 'park', side: 'S', mission: 14 },
  { type: 'crypt', loc: 'cem', side: 'W', mission: 19 }
];

async function arena(ctx, b) {
  const c = await client({ name: b.type }); ctx.clients.push(c);
  const s = await toBoss(c, b); assert(s && s.type === b.type, `boss ${b.type} did not spawn (${JSON.stringify(s)})`);
  await c.js(() => { const D = __dbg, e = D.ENEMIES.find(x => x.boss); D.TK.hp = 99999; Object.assign(D.TK, { x: e.x + 16, z: e.z + 12 }); });
  return c;
}
const boss = c => c.js(() => { const e = __dbg.ENEMIES.find(x => x.boss); return e ? { hp: e.hp, dead: !!e.dead, inv: !!e.inv, st: e.st, mode: e.mode, bar: !document.querySelector('#bossBar').hidden, bound: __dbg.BOSS.e === e } : null; });

export const tests = [
  ...BOSSES.map(b => ({ name: `${b.type}: spawn, bar, real shells`, timeout: 150, async run(ctx) {
    const c = await arena(ctx, b);
    if (b.type === 'crypt') { // lions first, then the Energobot comes out of the crypt
      const lions = await c.until(() => __dbg.ENEMIES.filter(e => e.type === 'lion' && !e.dead).length === 2, null, { timeout: 20000 }); assert(lions, 'lions did not appear');
      await c.wait(1500);
      await c.js(() => { for (const l of __dbg.ENEMIES.filter(e => e.type === 'lion')) { l.inv = false; __dbg.killEnemy(l, 1, 0, 'x'); } });
      const out = await c.until(() => { const e = __dbg.ENEMIES.find(x => x.boss); return e && e.st === 'fight'; }, null, { timeout: 60000 });
      assert(out, 'Energobot never left the crypt');
      const xf = await c.js(() => __dbg.ENEMIES.filter(e => e.xf && !e.dead).length); assert(xf === 12, 'transformers: ' + xf);
    }
    if (b.type === 'dragon') await c.until(() => { const e = __dbg.ENEMIES.find(x => x.boss); return e && e.st !== 'dance'; }, null, { timeout: 25000 });
    const a = await boss(c); assert(a && a.bar && a.bound, 'boss bar not shown / not bound: ' + JSON.stringify(a));
    for (let i = 0; i < 4; i++) { await shellAt(c); await c.wait(400); }
    await c.wait(800);
    const z = await boss(c);
    assert(z && !z.dead, `${b.type} died from 4 shells (state ${JSON.stringify(z)}) — reserved-field collision?`);
    assert(z.bar && z.bound, 'boss bar vanished after hits: ' + JSON.stringify(z));
    if (!a.inv) assert(z.hp < a.hp, `hp did not drop (${a.hp} → ${z.hp})`);
  } })),
  ...BOSSES.map(b => ({ name: `${b.type}: death sequence`, timeout: 120, async run(ctx) {
    const c = await arena(ctx, b);
    if (b.type === 'dragon') await c.until(() => { const e = __dbg.ENEMIES.find(x => x.boss); return e && e.st !== 'dance'; }, null, { timeout: 25000 });
    await c.js(() => { const e = __dbg.ENEMIES.find(x => x.boss); e.inv = false; e.hp = 1; __dbg.killEnemy(e, 1, 0, 'x'); });
    const gone = await c.until(() => !__dbg.ENEMIES.some(x => x.boss && !x.dead) && document.querySelector('#bossBar').hidden, null, { timeout: 45000 }); // the Hornet falls first, then explodes
    await c.shot('death');
    assert(gone, 'boss still present or bar still visible after death');
  } })),
  { name: 'krot: dig → emerge → shells do not freeze it (v27.3 regression)', slow: true, timeout: 200, async run(ctx) {
    const c = await arena(ctx, BOSSES[0]);
    await c.js(() => { const e = __dbg.ENEMIES.find(x => x.boss); e.st = 'toPile'; e.stT = 0; e.pile = null; });
    const dug = await c.until(() => __dbg.ENEMIES.find(x => x.boss)?.st === 'under', null, { timeout: 60000 }); assert(dug, 'Krot never dug in');
    await c.js(() => { const e = __dbg.ENEMIES.find(x => x.boss); e.stT = 13.5; e.mw = 2; });
    const up = await c.until(() => __dbg.ENEMIES.find(x => x.boss)?.st === 'roam', null, { timeout: 40000 }); assert(up, 'Krot never came back up');
    const p0 = await c.js(() => { const e = __dbg.ENEMIES.find(x => x.boss); return [e.x, e.z]; });
    for (let i = 0; i < 3; i++) { await shellAt(c); await c.wait(500); }
    await c.wait(6000);
    const z = await boss(c); assert(z && !z.dead && z.bar, 'Krot frozen/dead after emerging: ' + JSON.stringify(z));
    const moved = await c.js(p => { const e = __dbg.ENEMIES.find(x => x.boss); return Math.hypot(e.x - p[0], e.z - p[1]) > 0.5 || e.st !== 'roam'; }, p0);
    assert(moved, 'Krot stands still after being hit');
  } },
  { name: 'lion lasers: hit a tank that stands still, mostly miss one driving fast around them (v30.10)', timeout: 120, async run(ctx) {
    const c = await arena(ctx, BOSSES[3]);
    assert(await c.until(() => __dbg.ENEMIES.filter(e => e.type === 'lion' && !e.dead && e.st === 'prowl').length === 2, null, { timeout: 30000 }), 'lions did not wake');
    // one volley of eye lasers from 8 m; the tank either stands or circles the lion at 11 m/s (tangent to the beam)
    const volley = (move) => c.js(async (move) => { const D = __dbg, L = D.ENEMIES.filter(e => e.type === 'lion' && !e.dead), e = L[0];
      for (const l of L) { l.lcd = l.pcd = l.rcd = 99; } D.TK.hp = 99999;
      let ang = 0; const R = 8, put = () => { D.TK.x = e.x + Math.sin(ang) * R; D.TK.z = e.z + Math.cos(ang) * R; const v = move ? 11 : 0; D.TK.vx = Math.cos(ang) * v; D.TK.vz = -Math.sin(ang) * v; D.TK.vF = v; };
      put(); e.st = 'lcharge'; e.stT = 1.0; const hp0 = D.TK.hp; let last = performance.now();
      await new Promise(done => { const tick = () => { const now = performance.now(), dt = (now - last) / 1000; last = now; if (move) ang += 11 / R * dt; put();
        if (e.st === 'prowl' || e.dead) return done(); requestAnimationFrame(tick); }; tick(); });
      return hp0 - D.TK.hp; }, move);
    let still = 0, fast = 0; for (let i = 0; i < 3; i++) { still += await volley(false); fast += await volley(true); }
    assert(still > 30, 'standing tank barely hit: ' + still.toFixed(1));
    assert(fast < still * 0.4, 'fast tank hit as often as a standing one: still ' + still.toFixed(1) + ', fast ' + fast.toFixed(1));
  } },
  { name: 'transformers are immune and not targetable before the Energobot appears', async run(ctx) {
    const c = await arena(ctx, BOSSES[3]);
    const r = await c.js(() => __dbg.ENEMIES.filter(e => e.xf).map(e => [e.inv, e.lockable]));
    await c.wait(500);
    const r2 = await c.js(() => __dbg.ENEMIES.filter(e => e.xf).every(e => e.inv && !e.lockable));
    assert(r.length === 12 && r2, 'transformers vulnerable early: ' + JSON.stringify(r.slice(0, 3)));
  } }
];
