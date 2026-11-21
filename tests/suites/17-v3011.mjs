/* v30.11: the player's hull collides with its real (85%) footprint; parked tanks are solid (camp trees bend, v30.12);
   the see-through circle also cuts the chunk shadow overlay on HIGH, so the tank is visible behind tall buildings. */
import { client } from '../harness.mjs';
const assert = (c, m) => { if (!c) throw new Error(m); };
const drive = (c, steps, inp) => c.js(([n, inp]) => { const D = __dbg; for (let i = 0; i < n; i++) D.tankStep(1 / 60, inp); return { x: D.TK.x, z: D.TK.z, h: D.TK.h }; }, [steps, inp]);
const GAS = { throttle: 1, steer: 0, hb: false, joy: null, fire: false };

export const tests = [
  { name: 'hull footprint follows the machine: long RSZO-537 stops nose-first at a parked tank, 5T-L keeps its old size', timeout: 60, async run(ctx) {
    const c = await client({ name: 'foot' }); ctx.clients.push(c); await c.wait(1200);
    const base = await c.js(() => ({ ...__dbg.FOOT }));
    assert(base.L >= 1.37 && base.W >= 1.3, 'base tank got smaller: ' + JSON.stringify(base));
    await c.js(() => { const D = __dbg; D.UP.tanks.rszo = 1; D.selectTank('rszo'); D.buildGameTank(); });
    await c.until(() => __dbg.UP.tank === 'rszo' && __dbg.FOOT.L > 2.3, null, { timeout: 8000 });
    const f = await c.js(() => ({ ...__dbg.FOOT, model: __dbg.tankFoot(__dbg.tank) }));
    assert(f.L > 2.3 && f.L < f.model.L, 'rszo footprint: ' + JSON.stringify(f));
    // parked 5T-L at (18,55); come from the south heading +z
    const FF = await c.js(() => __dbg.FLEET_FOOT.base); const face = 55 - FF[0] * 0.95;
    await c.js(() => Object.assign(__dbg.TK, { x: 18, z: 44, h: 0, tYaw: 0, vx: 0, vz: 0, vF: 0 }));
    const r = await drive(c, 240, GAS);
    const nose = r.z + f.L, look = r.z + f.model.L;
    assert(Math.abs(r.x - 18) < 1.5, 'drifted sideways: ' + JSON.stringify(r));
    assert(nose <= face + 0.12 && nose > face - 0.8, `nose did not stop at the parked tank: nose ${nose.toFixed(2)}, face ${face.toFixed(2)}`);
    assert(look - (55 - FF[0]) < 0.75, 'model still drives deep into the parked tank: ' + (look - (55 - FF[0])).toFixed(2));
  } },
  { name: 'camp trees bend away and let the tank roll over them, holding it back a little (v30.12)', timeout: 60, async run(ctx) {
    const c = await client({ name: 'trunk' }); ctx.clients.push(c); await c.wait(1200);
    const r = await c.js(async () => { const D = __dbg; const trees = D.CDK.bend.filter(b => b.sh > 2);
      for (const b of trees) { if (D.tankContacts(b.x, b.z - 5, [], 0) || D.tankContacts(b.x, b.z - 2.5, [], 0) || D.tankContacts(b.x, b.z + 2.5, [], 0)) continue;
        Object.assign(D.TK, { x: b.x, z: b.z - 3, h: 0, tYaw: 0, vx: 0, vz: 9, vF: 9 }); let bend = 0;
        const t0 = performance.now(); while (performance.now() - t0 < 1600) { await new Promise(f => requestAnimationFrame(f)); bend = Math.max(bend, Math.hypot(b.ax, b.az)); }
        return { z: D.TK.z, bz: b.z, bend }; } return null; });
    assert(r, 'no free tree found');
    assert(r.z > r.bz + 0.5 && r.bend > 0.3, 'tank did not roll over the tree: ' + JSON.stringify(r));
  } },
  { name: 'HIGH: the tank behind a tall building is not darkened by the shadow overlay', timeout: 90, async run(ctx) {
    const c = await client({ name: 'xray', quality: 'high' }); ctx.clients.push(c);
    await c.js(() => __dbg.goLocation('west')); assert(await c.until(() => !__dbg.transit && __dbg.LOC === 'west', null, { timeout: 30000 }), 'no west');
    await c.wait(2500); await c.js(() => Object.assign(__dbg.TK, { x: 24, z: 48, vx: 0, vz: 0 })); await c.wait(3500);
    const xr = await c.js(() => [__dbg.XR.p.value.x / devicePixelRatio, innerHeight - __dbg.XR.p.value.y / devicePixelRatio, __dbg.XR.r.value]);
    assert(xr[2] > 20, 'the tank is not behind the building here: ' + JSON.stringify(xr));
    const lum = async () => { const b = await c.page.screenshot({ clip: { x: xr[0] - 22, y: xr[1] - 22, width: 44, height: 44 } });
      return c.js(async s => { const im = new Image(); im.src = 'data:image/png;base64,' + s; await im.decode(); const cv = document.createElement('canvas'); cv.width = im.width; cv.height = im.height; const g = cv.getContext('2d'); g.drawImage(im, 0, 0);
        const d = g.getImageData(0, 0, cv.width, cv.height).data; let t = 0; for (let i = 0; i < d.length; i += 4) t += 0.3 * d[i] + 0.59 * d[i + 1] + 0.11 * d[i + 2]; return t / (d.length / 4); }, b.toString('base64')); };
    const on = await lum(); await c.js(() => { __dbg.SHRC.visible = false; }); await c.wait(400); const off = await lum(); await c.js(() => { __dbg.SHRC.visible = true; });
    assert(on > off * 0.8, `tank area darkened by the overlay: ${on.toFixed(1)} vs ${off.toFixed(1)} without it`);
  } }
];
