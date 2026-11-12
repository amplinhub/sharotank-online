import { client } from '../harness.mjs';
const assert = (c, m) => { if (!c) throw new Error(m); };
export const tests = [
  { name: 'clearing a "clear the area" mission completes it', async run(ctx) {
    const c = await client({ name: 'clear', w: 412, h: 860, touch: true }); ctx.clients.push(c);
    const idx = await c.js(() => { const D = __dbg; let i = 0; while (D.missionAt(i).k !== 'clear') i++; const m = D.missionAt(i); D.MS.i = i; D.MS.active = true; D.goLocation(m.loc, 'W', { x: 4, z: 40, h: Math.PI / 2 }); return i; });
    await c.until(() => !__dbg.transit && __dbg.ENEMIES.length > 0, null, { timeout: 20000 });
    // the mission's extra squad (MXTRA) spawns after the first wave, so keep clearing until it completes
    const done = await c.until(I => { const D = __dbg; D.TK.hp = 9999; for (const e of D.ENEMIES.slice()) if (!e.dead) D.killEnemy(e, 0, 1); for (const d of D.DRONES) if (!d.dead) D.droneDie(d, 0, 1); return D.MS.i !== I || !D.MS.active; }, idx, { timeout: 30000, every: 1000 });
    assert(done, 'mission did not complete: ' + JSON.stringify(await c.js(() => [__dbg.MS.i, __dbg.MS.active, __dbg.LOC_ID, __dbg.enemiesLeft()])));
  } }
];
