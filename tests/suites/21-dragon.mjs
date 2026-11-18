/* «Золотой дракон» (v29.4): armour halved, armour strip in the boss bar, damaged sections spark / smoke. */
import { client, toBoss, shellAt } from '../harness.mjs';
const assert = (c, m) => { if (!c) throw new Error(m); };

export const tests = [
  { name: 'dragon: armour strip, critical and knocked-out sections', timeout: 150, async run(ctx) {
    const c = await client({ name: 'dragon-arm' }); ctx.clients.push(c);
    const s = await toBoss(c, { loc: 'park', side: 'S', mission: 14 }); assert(s && s.type === 'dragon', 'dragon did not spawn');
    await c.until(() => __dbg.ENEMIES.filter(x => x.type === 'dseg').length === 4, null, { timeout: 10000 });
    const a = await c.js(() => { const D = __dbg, segs = D.ENEMIES.filter(x => x.type === 'dseg'); return { hp: segs.map(q => q.maxHp), cells: document.querySelectorAll('#bbA span').length, hidden: document.querySelector('#bbA').hidden, txt: document.querySelector('#bbPh').textContent, shut: document.querySelector('#bbF').classList.contains('shut') }; });
    assert(a.hp.every(h => h === 130), 'armour section hp must be 130 (×bossMul 1): ' + a.hp);
    assert(a.cells === 4 && !a.hidden && a.txt === 'броня 4/4' && a.shut, 'armour strip: ' + JSON.stringify(a));
    // real shells into one section until it is critical
    await c.js(() => { const D = __dbg, e = D.ENEMIES.find(x => x.boss); D.TK.hp = 99999; e.u = 0; for (const q of D.ENEMIES.filter(x => x.type === 'dseg')) q.hp = q.maxHp; });
    const q0 = await c.js(() => __dbg.ENEMIES.find(x => x.type === 'dseg').si);
    await c.js(si => { const q = __dbg.ENEMIES.find(x => x.type === 'dseg' && x.si === si); q.hp = q.maxHp * 0.3; }, q0);
    const crit = await c.until(si => { const q = __dbg.ENEMIES.find(x => x.type === 'dseg' && x.si === si); return q.dK === 1 && document.querySelector('#bbA span.crit'); }, q0, { timeout: 5000 });
    assert(crit, 'critical section not marked');
    await c.js(si => { const D = __dbg, q = D.ENEMIES.find(x => x.type === 'dseg' && x.si === si); D.killEnemy(q, 1, 0, 'x'); }, q0);
    const off = await c.until(() => document.querySelector('#bbPh').textContent === 'броня 3/4' && document.querySelectorAll('#bbA span.off').length === 1, null, { timeout: 5000 });
    assert(off, 'knocked-out section not shown');
    const dk = await c.js(si => __dbg.ENEMIES.find(x => x.boss).segs.find(q => q.si === si).dK, q0); assert(dk === 2, 'dead section fx state: ' + dk);
    await c.wait(2500); // smoke/fire/pops run without errors
    // the rest go down → armour strip disappears, hp bar is no longer dimmed
    await c.js(() => { const D = __dbg; for (const q of D.ENEMIES.filter(x => x.type === 'dseg' && !x.dead)) D.killEnemy(q, 1, 0, 'x'); });
    const p2 = await c.until(() => { const e = __dbg.ENEMIES.find(x => x.boss); return e.ph === 2 && document.querySelector('#bbA').hidden && !document.querySelector('#bbF').classList.contains('shut'); }, null, { timeout: 5000 });
    assert(p2, 'phase 2: armour strip still shown');
    await shellAt(c); await c.wait(600);
    await c.shot('dragon-p2');
  } }
];
