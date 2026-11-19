/* v30.1: an automatic lock-on holds until the target dies or is > 45 m away — the Hornet's phase-2 flares and driving no longer drop it. */
import { client, toBoss } from '../harness.mjs';
const assert = (c, m) => { if (!c) throw new Error(m); };

export const tests = [
  { name: 'lock: Hornet phase 2 keeps the auto lock while driving and dropping flares', timeout: 120, async run(ctx) {
    const c = await client({ name: 'lock', touch: true }); ctx.clients.push(c);
    const s = await toBoss(c, { loc: 'auto', side: 'E', mission: 9 }); assert(s && s.type === 'hornet', 'no hornet');
    await c.js(() => { const D = __dbg, e = D.ENEMIES.find(x => x.boss); D.setAimMode('stick'); D.TK.hp = 99999; e.hp = e.maxHp * 0.5; e.ph = 2; e.flCD = 0; e.x = D.TK.x + 18; e.z = D.TK.z; D.AIM.manual = null; D.AIM.lockE = e; });
    let lost = 0, far = 0, flares = 0;
    for (let i = 0; i < 40; i++) {
      const r = await c.js(() => { const D = __dbg, e = D.ENEMIES.find(x => x.boss); D.TK.vx = 4 * Math.sin(D.TK.h); D.TK.vz = 4 * Math.cos(D.TK.h); D.TK.vF = 4; if (e.flCD > 9) e.flCD = 0.05;
        const d = Math.hypot(e.x - D.TK.x, e.z - D.TK.z); return { d, ok: D.AIM.lockE === e, fl: e.flCD }; });
      if (r.d <= 44 && !r.ok) lost++; if (r.d > 46) far++; if (r.fl > 0) flares++;
      await c.wait(200);
    }
    assert(lost === 0, `lock dropped ${lost} times within 45 m (far samples ${far})`);
    // beyond 45 m the lock lets go
    const away = await c.js(() => { const D = __dbg, e = D.ENEMIES.find(x => x.boss); e.x = D.TK.x + 70; e.z = D.TK.z; const lk = D.findLock(); return { held: !!lk && lk[0] === e, d: Math.hypot(e.x - D.TK.x, e.z - D.TK.z), mode: D.AIM.manual ? 'manual' : '' }; });
    assert(!away.held, 'lock held at 70 m: ' + JSON.stringify(away));
  } },
  { name: 'artillery: circles follow a moving robot and land on it', timeout: 120, async run(ctx) {
    const c = await client({ name: 'art' }); ctx.clients.push(c);
    await c.js(() => __dbg.goLocation('north', 'S')); await c.until(() => !__dbg.transit && __dbg.LOC === 'north', null, { timeout: 30000 }); await c.wait(500);
    await c.js(() => { const D = __dbg; for (const e of D.ENEMIES) if (!e.dead) D.eRemove(e); D.TK.hp = 99999; D.ST.kits.art = 1;
      const e = D.spawnEnemy('bull', D.TK.x + 4, D.TK.z + 18); e.hp = e.maxHp = 99999; e.noScrap = true; e.speedW = 0; e.acc = 0; e.cd = 99; /* only the test drags it — its own AI must not add motion */ window.__art = { e, x0: e.x, z0: e.z }; D.useArt(); });
    // drag the robot sideways at ~3 m/s while the salvo is in the air
    let miss = 0, n = 0;
    for (let i = 0; i < 30; i++) {
      const r = await c.js(() => { const D = __dbg, A = window.__art, e = A.e; const cs = D.ART.circles.filter(q => q.e === e && q.t > 1.5);
        const out = cs.map(q => Math.hypot(q.x - e.x - q.ox * (1 - 0.55 * (1 - Math.pow(1 - Math.min(1, q.t / 2), 2))), q.z - e.z - q.oz * (1 - 0.55 * (1 - Math.pow(1 - Math.min(1, q.t / 2), 2))))); e.x += 0.6; e.vx = 3; return out; });
      for (const d of r) { n++; if (d > 1.2) miss++; }
      await c.wait(200);
    }
    const moved = await c.js(() => window.__art.e.x - window.__art.x0);
    assert(moved > 10, 'robot did not move: ' + moved);
    assert(n > 0 && miss === 0, `circles did not follow the robot: ${miss} of ${n} late samples off`);
  } }
];
