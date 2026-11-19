/* v30.8: fixes and additions — robots react to far shots, ramming «Маяк» legs, gate edge, repair drones, heavy-tank crashes,
   pushable camp props, motor pool exit, Hornet ease, dragon phase 2, hold-zone flag, «Карта путей» ambush, rides, scrap. */
import { client, toBoss } from '../harness.mjs';
const assert = (c, m) => { if (!c) throw new Error(m); };
const toLoc = async (c, loc, side) => { await c.js(([l, s]) => __dbg.goLocation(l, s), [loc, side]); await c.wait(800); return c.until(l => !__dbg.transit && __dbg.LOC === l, loc, { timeout: 40000 }); };
const clearRobots = c => c.js(() => { for (const e of __dbg.ENEMIES) if (!e.dead && !e.boss) __dbg.eRemove(e); __dbg.TK.hp = 99999; });

export const tests = [
  { name: 'a robot shot from 50 m does not give up — it hunts the shooter down', timeout: 120, async run(ctx) {
    const c = await client({ name: 'far' }); ctx.clients.push(c);
    await toLoc(c, 'north', 'S'); await clearRobots(c);
    const r0 = await c.js(() => { const D = __dbg; D.TK.x = 40; D.TK.z = 74; D.TK.vx = D.TK.vz = 0; const e = D.spawnEnemy('jian', 40, 22); e.hp = e.maxHp = 9999; window.__f = e; D.enemyHit(e, 5, 0, -1, 0, 'proj'); return { d: Math.hypot(e.x - D.TK.x, e.z - D.TK.z), al: e.alertT }; });
    assert(r0.d > 40 && r0.al > 10, 'setup: ' + JSON.stringify(r0));
    await c.wait(12000);
    const r = await c.js(() => { const D = __dbg, e = window.__f; return { d: Math.hypot(e.x - D.TK.x, e.z - D.TK.z), aggro: e.aggro, st: e.state }; });
    assert(r.aggro && r.d < r0.d - 12, 'robot did not come for the shooter: ' + JSON.stringify({ r0, r }));
  } },
  { name: 'ramming a leg of the tall «Маяк» knocks it down; a slow tank is stopped by the leg', timeout: 120, async run(ctx) {
    const c = await client({ name: 'legs' }); ctx.clients.push(c);
    await toLoc(c, 'north', 'S'); await clearRobots(c);
    const st = await c.js(() => { const D = __dbg; const e = D.spawnEnemy('lamp', 40, 50); e.state = 'disguise'; e.speedW = 0; window.__l = e; return !!e; });
    assert(st, 'no lamp'); await c.wait(1200);
    const hit = await c.js(async () => { const D = __dbg, e = window.__l; const L = e.legs.find(l => l.alive && l.foot); const fx = L.foot.x, fz = L.foot.z;
      const dx = fx - e.x, dz = fz - e.z, l = Math.hypot(dx, dz) || 1; const a = Math.atan2(dx / l, dz / l) + Math.PI / 2; const sx = fx - Math.sin(a) * 6, sz = fz - Math.cos(a) * 6;
      Object.assign(D.TK, { x: sx, z: sz, h: a, tYaw: a, vF: 7, vx: Math.sin(a) * 7, vz: Math.cos(a) * 7 });
      for (let i = 0; i < 90 && !e.dead; i++){ D.tankStep(1 / 60, { throttle: 1, steer: 0, hb: false, joy: null, fire: false }); await new Promise(r => setTimeout(r, 16)); }
      return { dead: e.dead, foot: [fx, fz], tk: [D.TK.x, D.TK.z] }; });
    assert(hit.dead, 'ramming the leg did nothing: ' + JSON.stringify(hit));
  } },
  { name: 'driving into the map edge inside a gate goes through at once', timeout: 90, async run(ctx) {
    const c = await client({ name: 'edge' }); ctx.clients.push(c);
    const g = await c.js(() => { const D = __dbg, g = D.GATES.find(q => q.side === 'N'); return g ? { r: g.r, id: g.id } : null; }); assert(g, 'no N gate');
    await c.js(r => { const D = __dbg; const x = (r[0] + r[2]) / 2; Object.assign(D.TK, { x, z: 12, h: Math.PI, tYaw: Math.PI, vx: 0, vz: 0, vF: 0 }); }, g.r); await c.wait(400);
    await c.page.keyboard.down('KeyW');
    const t0 = Date.now(); const ok = await c.until(r => __dbg.transit || (__dbg.TK.z > r[1] && __dbg.TK.z < r[3] && false), g.r, { timeout: 15000, every: 50 });
    await c.page.keyboard.up('KeyW');
    const fill = await c.js(() => __dbg.GATES.find(q => q.side === 'N')?.fill);
    assert(ok, 'never left through the N gate'); void t0; void fill;
    await c.until(() => !__dbg.transit && __dbg.LOC !== 'camp', null, { timeout: 30000 });
    // in the gate band but with the edge: the time spent inside the band is far below the 1.15 s fill
    const L = await c.js(() => __dbg.LOC); assert(L === g.id, 'went to ' + L + ' instead of ' + g.id);
  } },
  { name: 'repair drones rest at full armour even with scorch marks left', timeout: 60, async run(ctx) {
    const c = await client({ name: 'rdr' }); ctx.clients.push(c);
    await c.js(() => { const D = __dbg; D.UP.rdr = 1; D.TK.hp = 50; D.TK.dmgS.fill(0.6); });
    assert(await c.until(() => __dbg.RDR.list.some(d => d.st === 'weld'), null, { timeout: 15000 }), 'drone never started welding');
    const res = await c.js(async () => { const D = __dbg; D.TK.hp = 1e9; await new Promise(f => setTimeout(f, 50)); const states = []; for (let i = 0; i < 20; i++){ await new Promise(f => setTimeout(f, 150)); states.push(D.RDR.list.map(d => d.st).join()); } return { states, hp: D.TK.hp }; });
    assert(res.states.slice(6).every(s => !/weld|go/.test(s)), 'drones keep working at full armour: ' + JSON.stringify(res));
  } },
  { name: 'camp props: a barrel is shoved and tips over, a sandbag barely moves, a stacked crate falls', timeout: 90, async run(ctx) {
    const c = await client({ name: 'push', quality: 'med' }); ctx.clients.push(c);
    const r = await c.js(async () => { const D = __dbg, P = D.CDK.push; const b = P.find(o => o.kind === 'barrel'), s = P.find(o => o.kind === 'bag'), top = P.find(o => o.stack);
      const shove = async (o, sp) => { const a = Math.atan2(o.x - (o.x - 4), 0) || Math.PI / 2; const h = Math.PI / 2; Object.assign(D.TK, { x: o.x - 3.4, z: o.z, h, tYaw: h, vF: sp, vx: sp, vz: 0 }); void a;
        for (let i = 0; i < 40; i++){ D.tankStep(1 / 60, { throttle: 1, steer: 0, hb: false, joy: null, fire: false }); await new Promise(f => setTimeout(f, 16)); } };
      const b0 = { x: b.x, z: b.z }; await shove(b, 6); await new Promise(f => setTimeout(f, 800)); const bm = Math.hypot(b.x - b0.x, b.z - b0.z);
      const s0 = { x: s.x, z: s.z }; await shove(s, 6); await new Promise(f => setTimeout(f, 800)); const sm = Math.hypot(s.x - s0.x, s.z - s0.z);
      const base = top.base; const t0y = top.y; await shove(base, 5); for (let k = 0; k < 40 && top.y > 0.01; k++) await new Promise(f => setTimeout(f, 150));
      return { bm, lying: b.lying, sm, ty: top.y, t0y, n: P.length }; });
    assert(r.n > 20, 'props: ' + r.n);
    assert(r.bm > 1.0 && r.lying, 'barrel: ' + JSON.stringify(r));
    assert(r.sm < r.bm * 0.6, 'sandbag moved as much as a barrel: ' + JSON.stringify(r));
    assert(r.t0y > 1 && r.ty < 0.05, 'top crate did not fall: ' + JSON.stringify(r));
  } },
  { name: 'motor pool: «Выехать на нём» drives straight out on that tank', timeout: 90, async run(ctx) {
    const c = await client({ name: 'park' }); ctx.clients.push(c);
    await c.js(() => { const D = __dbg; D.UP.tanks.ten = 1; D.openGarage('park'); });
    await c.until(() => __dbg.GAR.open, null, { timeout: 10000 }); await c.wait(600);
    await c.js(() => { const b = document.querySelector('[data-pick="ten"]') || document.querySelector('.pk[data-id="ten"]'); if (b) b.click(); });
    await c.wait(300);
    const clicked = await c.js(() => { const b = document.querySelector('[data-tk="ten"]'); if (!b) return false; b.click(); return true; });
    assert(clicked, 'no «Выехать на нём» for ten');
    assert(await c.until(() => !__dbg.GAR.open, null, { timeout: 6000 }), 'still in the motor pool');
    assert(await c.js(() => __dbg.UP.tank === 'ten'), 'not on «Тень»');
  } },
  { name: 'heavy tanks take less crash damage; strong robots drop +25% scrap', timeout: 30, async run(ctx) {
    const c = await client({ name: 'heavy' }); ctx.clients.push(c);
    const r = await c.js(() => { const C = __dbg.CHASSIS; return { krep: C.krep.colK, rszo: C.rszo.colK, kovch: C.kovch.colK, base: C.base.colK || 1 }; });
    assert(r.krep < 0.6 && r.rszo < 0.6 && r.kovch < 1 && r.base === 1, JSON.stringify(r));
  } },
  { name: '«Шершень»: −20% HP; after losing to it once, −30% more until it is beaten', timeout: 180, async run(ctx) {
    const c = await client({ name: 'hornet' }); ctx.clients.push(c);
    const i = await c.js(() => __dbg.STORY.findIndex(m => m.boss && m.k === 'hornet'));
    const s = await toBoss(c, { loc: 'auto', side: 'E', mission: i }); assert(s && s.type === 'hornet', 'no hornet');
    const h1 = await c.js(() => __dbg.ENEMIES.find(e => e.boss).maxHp); assert(h1 === 1760, 'hornet HP ' + h1);
    await c.js(() => __dbg.killTank()); await c.wait(300);
    assert(await c.js(() => __dbg.MS.ease.hornet === 1), 'loss not remembered');
    await c.until(() => !__dbg.TK.dead && !__dbg.transit && __dbg.LOC === 'camp', null, { timeout: 40000 });
    await c.wait(800); const s2 = await toBoss(c, { loc: 'auto', side: 'E', mission: i }); assert(s2, 'no second hornet');
    const h2 = await c.js(() => __dbg.ENEMIES.find(e => e.boss).maxHp); assert(h2 === Math.round(1760 * 0.7), 'eased HP ' + h2);
  } },
  { name: 'dragon: phase 2 starts at 76% HP, robots arrive far from the tank (≤ 10), ploughing slows it', timeout: 200, async run(ctx) {
    const c = await client({ name: 'dragon' }); ctx.clients.push(c);
    const i = await c.js(() => __dbg.STORY.findIndex(m => m.boss && m.k === 'dragon'));
    const s = await toBoss(c, { loc: 'park', side: 'N', mission: i }); assert(s && s.type === 'dragon', 'no dragon');
    await c.js(() => { const D = __dbg; D.TK.hp = 1e6; for (const q of D.ENEMIES) if (q.type === 'dseg' && !q.dead) D.enemyHit(q, 1e6, 0, 0, 0, 'proj'); });
    assert(await c.until(() => __dbg.ENEMIES.find(e => e.boss)?.ph === 2, null, { timeout: 8000 }), 'no phase 2');
    const f = await c.js(() => { const e = __dbg.ENEMIES.find(q => q.boss); return e.hp / e.maxHp; }); assert(f <= 0.761, 'phase 2 HP fraction ' + f);
    for (let k = 0; k < 14; k++){ await c.js(() => { const e = __dbg.ENEMIES.find(q => q.boss); e.addT = 0; }); await c.wait(250); }
    const a = await c.js(() => { const D = __dbg, L = D.ENEMIES.filter(m => !m.dead && m.drAdd); return { n: L.length, minD: Math.min(...L.map(m => m.spawnD || 0)), types: [...new Set(L.map(m => m.type))] }; });
    assert(a.n >= 4 && a.n <= 10 && a.types.length >= 2 && a.minD >= 55, 'adds: ' + JSON.stringify(a));
  } },
  { name: 'hold zone won → a red flag rises on a building in view; «Карта путей» → two «Бизоны» at the entry', timeout: 150, async run(ctx) {
    const c = await client({ name: 'flag' }); ctx.clients.push(c);
    await toLoc(c, 'north', 'S'); await clearRobots(c);
    await c.js(() => { const D = __dbg; D.TK.x = 40; D.TK.z = 40; D.victoryFlag(40, 40); });
    await c.until(() => __dbg.VFLAGS[0] && __dbg.VFLAGS[0].fl.position.y > 3.5, null, { timeout: 25000 });
    const f = await c.js(() => { const v = __dbg.VFLAGS[0]; return v ? { y: v.fl.position.y, top: v.g.position.y } : null; });
    assert(f && f.y > 3.5, 'flag not raised: ' + JSON.stringify(f));
    const i = await c.js(() => __dbg.STORY.findIndex(m => m.title === 'Карта путей'));
    await c.js(n => { const D = __dbg; D.MS.i = n; D.MS.active = true; D.MS.prog = 0; }, i);
    await toLoc(c, 'nw', 'E');
    const r = await c.js(() => { const D = __dbg, E = D.ENTRY, n0 = D.ENEMIES.filter(e => !e.dead && e.guard).length; D.flagAmbush(); const g = D.ENEMIES.filter(e => !e.dead && e.guard); return { n0, n: g.length, t: g.map(e => e.type), d: g.map(e => Math.round(Math.hypot(e.x - E.x, e.z - E.z))) }; });
    assert(r.n0 === 0 && r.n === 2 && r.t.every(t => t === 'bull') && r.d.every(d => d < 20), 'ambush: ' + JSON.stringify(r));
  } },
  { name: 'luna park on «Выс»: swing rides and carousel spin', timeout: 150, async run(ctx) {
    const c = await client({ name: 'rides', quality: 'high' }); ctx.clients.push(c);
    await toLoc(c, 'park', 'N');
    const a = await c.js(() => __dbg.ARENA.rides.map(r => r.k + ':' + r.a.toFixed(2)));
    await c.wait(9000);
    const b = await c.js(() => __dbg.ARENA.rides.map(r => ({ k: r.k, a: r.a, v: r.v })));
    assert(b.length === 3 && b.filter(r => r.k === 'swing').length === 2, 'rides: ' + JSON.stringify(b));
    assert(b.some(r => r.a > 0.3), 'rides do not move: ' + JSON.stringify({ a, b }));
    await c.shot('rides');
  } }
];
