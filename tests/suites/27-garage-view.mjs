/* v30.3: in the garage / motor pool, things between the orbiting camera and the tank fade out, and come back afterwards. */
import { client } from '../harness.mjs';
const assert = (c, m) => { if (!c) throw new Error(m); };
const faded = () => { let f = 0; __dbg.GAR.scene.traverse(o => { if (o.userData && o.userData.occM) f++; }); return f; };

export const tests = [
  { name: 'garage view: occluders fade out and restore', timeout: 90, async run(ctx) {
    const c = await client({ name: 'garview', w: 390, h: 800, touch: true, quality: 'high' }); ctx.clients.push(c);
    for (const [mode, ang, hgt] of [['gar', 2.45, 0.8], ['park', 1.8, 0.8]]) {
      await c.js(m => __dbg.openGarage(m), mode); await c.until(() => __dbg.GAR.open, null, { timeout: 10000 }); await c.wait(600);
      await c.js(([a, h]) => { Object.assign(__dbg.GAR, { ang: a, hgt: h, idle: -99 }); }, [ang, hgt]); await c.wait(700);
      const n = await c.js(faded); assert(n > 0, mode + ': nothing faded although the view is blocked');
      await c.js(() => { Object.assign(__dbg.GAR, { hgt: 3.6, ang: 0.75 }); }); await c.wait(1500);
      await c.js(() => __dbg.closeGarage()); await c.wait(900);
      assert(await c.js(faded) === 0, mode + ': faded copies left after closing');
    }
  } }
];
