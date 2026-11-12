import { client } from '../harness.mjs';
const assert = (c, m) => { if (!c) throw new Error(m); };
export const tests = [
  { name: 'clearing a "clear the area" mission completes it', async run(ctx) {
    const c = await client({ name: 'clear', w: 412, h: 860, touch: true }); ctx.clients.push(c);
    await c.js(() => { const D = __dbg; D.MS.i = 15; D.MS.active = true; D.goLocation('se', 'W', { x: 4, z: 40, h: Math.PI / 2 }); });
    await c.until(() => !__dbg.transit && __dbg.ENEMIES.length > 0, null, { timeout: 20000 });
    await c.js(() => { __dbg.TK.hp = 9999; for (const e of __dbg.ENEMIES.slice()) __dbg.killEnemy(e, 0, 1); });
    const done = await c.until(() => __dbg.MS.i === 16 || !__dbg.MS.active, null, { timeout: 15000 });
    assert(done, 'mission did not complete: ' + JSON.stringify(await c.js(() => [__dbg.MS.i, __dbg.MS.active])));
  } }
];
