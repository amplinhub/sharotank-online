/* v30.12: garage exit always reachable, ☰ menu folds on outside touch, pop-up win for 2.5 s, Krepost shield −30% + handbrake,
   no СМЕНА for one-weapon tanks, first tutorial mark 10 m ahead, invisible parked-tank hulls, jointed mechanics. */
import { client } from '../harness.mjs';
const assert = (c, m) => { if (!c) throw new Error(m); };

export const tests = [
  { name: 'garage on a phone: the exit button is on screen without scrolling', timeout: 60, async run(ctx) {
    const c = await client({ name: 'gx', w: 390, h: 800, touch: true }); ctx.clients.push(c);
    await c.js(() => __dbg.openGarage('gar')); await c.until(() => __dbg.GAR.open, null, { timeout: 10000 }); await c.until(() => { const f = document.querySelector('#fade'); return !f.classList.contains('on') && +getComputedStyle(f).opacity < 0.05; }, null, { timeout: 8000 }); await c.wait(300);
    for (const sc of [0, 400, 99999]) { const r = await c.js(sc => { const P = document.querySelector('#gpanel'); P.scrollTop = sc; const b = document.querySelector('#gExit').getBoundingClientRect(); const e = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2);
        return { top: b.top, bottom: b.bottom, h: innerHeight, hit: !!(e && e.closest('#gExit')), at: e && (e.id || e.className), fade: document.querySelector('#fade').className }; }, sc);
      assert(r.hit && r.bottom <= r.h + 1 && r.top > r.h * 0.5, 'exit button hidden at scroll ' + sc + ': ' + JSON.stringify(r)); }
    await c.js(() => document.querySelector('#gExit').click()); assert(await c.until(() => !__dbg.GAR.open, null, { timeout: 5000 }), 'exit did not close the garage');
  } },
  { name: '☰ menu folds when the player touches the game or presses a game key, and the touch still reaches the game', timeout: 60, async run(ctx) {
    const c = await client({ name: 'mn' }); ctx.clients.push(c); await c.wait(800);
    const open = () => c.js(() => { document.querySelector('#bMenu').click(); return !document.querySelector('#trMenu').hidden; });
    assert(await open(), 'menu did not open');
    await c.page.mouse.click(200, 380); await c.wait(150);
    assert(await c.js(() => document.querySelector('#trMenu').hidden), 'menu stayed open after a click on the game');
    assert(await open(), 'menu did not reopen');
    const inside = await c.js(() => { const M = document.querySelector('#trMenu'), b = M.getBoundingClientRect(); for (let y = b.top + 2; y < b.bottom; y += 3) for (let x = b.left + 2; x < b.right; x += 3) { const e = document.elementFromPoint(x, y); if (e && M.contains(e) && !e.closest('button,input,label,a')) return [x, y]; } return null; });
    assert(inside, 'no passive spot inside the menu'); await c.page.mouse.click(inside[0], inside[1]); await c.wait(150);
    assert(!(await c.js(() => document.querySelector('#trMenu').hidden)), 'a click inside the menu closed it');
    await c.page.keyboard.press('KeyW'); await c.wait(150);
    assert(await c.js(() => document.querySelector('#trMenu').hidden), 'menu stayed open after W');
  } },
  { name: 'win screen pops up and is gone after ~2.5 s', timeout: 60, async run(ctx) {
    const c = await client({ name: 'wn' }); ctx.clients.push(c); await c.wait(800);
    const r = await c.js(async () => { const w = document.querySelector('#win'); let t0 = 0, t1 = 0;
      const mo = new MutationObserver(() => { if (!w.hidden && !t0) t0 = performance.now(); if (w.hidden && t0 && !t1) t1 = performance.now(); }); mo.observe(w, { attributes: true });
      __dbg.forceWin(); const s = performance.now(); while (!t1 && performance.now() - s < 9000) await new Promise(f => setTimeout(f, 50)); mo.disconnect(); return { shown: !!t0, dur: t1 ? (t1 - t0) / 1000 : null }; });
    assert(r.shown && r.dur != null && r.dur > 2.2 && r.dur < 3.3, 'win screen time: ' + JSON.stringify(r));
  } },
  { name: 'Krepost: shield −30% and the handbrake holds the tank while it is up', timeout: 60, async run(ctx) {
    const c = await client({ name: 'kp' }); ctx.clients.push(c); await c.wait(800);
    await c.js(() => { const D = __dbg; D.UP.tanks.krep = 1; D.selectTank('krep'); D.buildGameTank(); D.updateWeaponUI(); D.goLocation('north'); });
    assert(await c.until(() => !__dbg.transit && __dbg.LOC === 'north', null, { timeout: 30000 }), 'no north');
    await c.wait(800);
    const r = await c.js(() => { const D = __dbg; D.SHD.hp = D.SHD.max; D.SHD.cd = 0; D.shieldToggle(); const on = D.SHD.on; D.TK.vx = 6; D.TK.vz = 0;
      for (let i = 0; i < 30; i++) D.tankStep(1 / 60, { throttle: 0, steer: 0, hb: true, joy: null, fire: false }); return { max: D.SHD.max, on, v: Math.hypot(D.TK.vx, D.TK.vz) }; });
    assert(r.max === 180 && r.on, 'shield: ' + JSON.stringify(r));
    assert(r.v < 0.3, 'tank still sliding with the shield up: ' + JSON.stringify(r));
  } },
  { name: 'СМЕНА only for tanks with more than one weapon', timeout: 60, async run(ctx) {
    const c = await client({ name: 'sw', touch: true }); ctx.clients.push(c); await c.wait(800);
    const vis = () => c.js(() => getComputedStyle(document.querySelector('#bSwap')).visibility);
    assert(await vis() === 'visible', 'base tank lost its СМЕНА button');
    for (const id of ['pchela', 'rszo']) { await c.js(id => { const D = __dbg; D.UP.tanks[id] = 1; D.selectTank(id); D.buildGameTank(); D.updateWeaponUI(); }, id);
      assert(await vis() === 'hidden', id + ' still shows СМЕНА'); }
  } },
  { name: 'tutorial: the first mark is 10 m in front of the tank', timeout: 60, async run(ctx) {
    const c = await client({ name: 'tw', tut: true }); ctx.clients.push(c); await c.wait(800);
    const r = await c.js(async () => { const D = __dbg; Object.assign(D.TK, { x: 40, z: 44, h: Math.PI, tYaw: Math.PI, vx: 0, vz: 0 }); D.TUT.step = -1; D.tutRestart();
      await new Promise(f => setTimeout(f, 1500)); const dx = D.TUT_W1.x - D.TK.x, dz = D.TUT_W1.z - D.TK.z; return { d: Math.hypot(dx, dz), a: Math.atan2(dx, dz), h: D.TK.h, w: { ...D.TUT_W1 } }; });
    const da = Math.abs(Math.atan2(Math.sin(r.a - r.h), Math.cos(r.a - r.h)));
    assert(r.d > 6.5 && r.d < 11.5 && da < 0.55, 'mark is not ahead: ' + JSON.stringify(r));
  } },
  { name: 'parked tanks collide but their hulls are invisible; lying mechanics keep their feet on the floor', timeout: 60, async run(ctx) {
    const c = await client({ name: 'pk' }); ctx.clients.push(c); await c.wait(1200);
    const r = await c.js(() => { const D = __dbg; const m = D.get(Math.floor(18 / D.VS), Math.floor(0.6 / D.VS), Math.floor(55 / D.VS)); return { m, inv: !!(m && D.MD && D.MD[m] && D.MD[m].inv), hit: D.tankContacts(18, 52.5, [], 0) }; });
    assert(r.m && r.hit > 0, 'parked tank does not collide: ' + JSON.stringify(r));
    assert(r.inv, 'hull material is not the invisible one: ' + JSON.stringify(r));
    const f = await c.js(() => { const D = __dbg, TH = THREE, s = new TH.Scene(), L = D.makeLyingMech(s, 0); D.lyingUpdate(L, 1.3); s.updateMatrixWorld(true); const v = new TH.Vector3();
      return L.P.legs.map(l => { l.ank.getWorldPosition(v); const a = v.y; l.knee.getWorldPosition(v); return [a, v.y]; }); });
    for (const [a, k] of f) assert(a > 0.02 && a < 0.2 && k > a + 0.25, 'lying legs: ' + JSON.stringify(f));
  } }
];
