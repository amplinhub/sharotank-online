/* Every exit between locations is a clear road: no voxels in a tank-wide corridor 9 m deep from the edge (v29.4). */
import { client } from '../harness.mjs';
const assert = (c, m) => { if (!c) throw new Error(m); };

export const tests = [
  { name: 'gates: no obstacles at any location exit', timeout: 400, async run(ctx) {
    const c = await client({ name: 'gates' }); ctx.clients.push(c);
    const ids = await c.js(() => Object.keys(__dbg.LOCS).filter(i => __dbg.LOCS[i].exits));
    const bad = [];
    for (const id of ids) {
      const side = await c.js(i => Object.keys(__dbg.LOCS[i].exits)[0], id);
      await c.js(([i, s]) => __dbg.goLocation(i, s), [id, side]);
      assert(await c.until(i => !__dbg.transit && __dbg.LOC === i, id, { timeout: 30000 }), 'did not load ' + id);
      const r = await c.js(() => { const D = __dbg, VS = D.VS, W = D.LOCS[D.LOC].size || 80, cc = W / 2, out = [];
        for (const s in D.LOCS[D.LOC].exits) { let n = 0, at = null;
          for (let d = 0.2; d < 9; d += VS) for (let w = -2.6; w <= 2.6; w += VS) for (let y = 0.45; y < 2.0; y += VS) {
            const x = s === 'W' ? d : s === 'E' ? W - d : cc + w, z = s === 'N' ? d : s === 'S' ? W - d : cc + w;
            if (D.get(Math.round(x / VS), Math.round(y / VS), Math.round(z / VS))) { n++; at = at || [+x.toFixed(1), +z.toFixed(1)]; } }
          if (n) out.push(`${D.LOC} ${s}→${D.LOCS[D.LOC].exits[s]}: ${n} voxels near ${at}`); }
        return out; });
      bad.push(...r);
    }
    assert(!bad.length, 'blocked exits:\n' + bad.join('\n'));
  } }
];
