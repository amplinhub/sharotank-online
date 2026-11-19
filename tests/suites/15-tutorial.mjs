/* v30.7: start screen for new / returning players, the camp tutorial (real shots at real targets),
   touch controls only on touch, «Управление» dialog, reset behind a confirmation, one-off hints in a fight. */
import { client } from '../harness.mjs';
const assert = (c, m) => { if (!c) throw new Error(m); };
const vis = sel => { const e = document.querySelector(sel); return !!e && !e.hidden && getComputedStyle(e).display !== 'none' && e.getClientRects().length > 0; };
const V = (c, sel) => c.js(([s, f]) => new Function('sel', 'return (' + f + ')(sel)')(s), [sel, vis.toString()]);
const tst = c => c.js(() => { const T = __dbg.TUT; return { on: T.on, step: T.step, done: T.done, card: !document.querySelector('#tut').hidden, dead: T.tg.filter(t => t.dead).length, n: T.tg.length }; });
const fireDown = (c, touch) => touch ? c.js(() => document.querySelector('#bFire').dispatchEvent(new PointerEvent('pointerdown', { pointerId: 7, pointerType: 'touch', bubbles: true }))) : c.page.keyboard.down('KeyF');
const fireUp = (c, touch) => touch ? c.js(() => document.querySelector('#bFire').dispatchEvent(new PointerEvent('pointerup', { pointerId: 7, pointerType: 'touch', bubbles: true }))) : c.page.keyboard.up('KeyF');

async function drill(c, touch) {
  await c.until(() => __dbg.TUT.step === 0 && !document.querySelector('#tut').hidden, null, { timeout: 15000 });
  // step 1: drive — the beacon is the arrow target; the HQ is locked meanwhile
  const s0 = await c.js(() => ({ hq: !document.querySelector('#hqMark').hidden, safe: document.querySelector('#bFire').classList.contains('safe') }));
  assert(!s0.hq, 'HQ marker shown during the drive step');
  await c.js(() => { const D = __dbg, H = D.HQ; Object.assign(D.TK, { x: (H.x0 + H.x1) / 2, z: (H.z0 + H.z1) / 2 }); });
  await c.wait(600); assert(await c.js(() => !__dbg.mcOpen && __dbg.TUT.step === 0), 'HQ opened before the drill was done');
  await c.js(() => { const D = __dbg; Object.assign(D.TK, { x: D.TUT_W1.x - 1, z: D.TUT_W1.z, h: Math.PI / 2, tYaw: Math.PI / 2, vx: 0, vz: 0, vF: 0 }); });
  assert(await c.until(() => __dbg.TUT.step === 1 && __dbg.TUT.tg.length === 2, null, { timeout: 8000 }), 'drive step did not complete');
  // step 2: real shells at the targets (soft aim assist, like the auto-lock on robots)
  await c.js(() => __dbg.setAimMode('stick')); await c.wait(900);
  const dst0 = await c.js(() => document.querySelector('#dst').textContent);
  await fireDown(c, touch);
  assert(await c.until(() => __dbg.TUT.step === 2, null, { timeout: 30000 }), 'targets not shot down: ' + JSON.stringify(await tst(c)));
  await fireUp(c, touch);
  // step 3: the machine gun only clangs off the armoured one
  await c.wait(1800); await fireDown(c, touch); await c.wait(2000); await fireUp(c, touch);
  const arm = await c.js(() => { const a = __dbg.TUT.tg.find(t => t.arm); return { dead: a.dead, w: __dbg.wcur }; });
  assert(!arm.dead && arm.w === 0, 'MG broke the armoured target: ' + JSON.stringify(arm));
  if (touch) await c.js(() => document.querySelector('#bSwap').dispatchEvent(new PointerEvent('pointerdown', { pointerId: 8, pointerType: 'touch', bubbles: true })));
  else await c.page.keyboard.press('KeyQ');
  await c.wait(700); await c.js(() => __dbg.setAimMode('stick')); await fireDown(c, touch);
  assert(await c.until(() => __dbg.TUT.step === 3, null, { timeout: 25000 }), 'cannon did not break the armoured target');
  await fireUp(c, touch);
  assert(await c.js(() => document.querySelector('#dst').textContent) === dst0, 'shooting in the camp broke the camp');
  // step 4: drive into HQ → drill over, mission card, reward
  const sc = await c.js(() => __dbg.ST.scrap);
  await c.wait(1500); await c.js(() => { const D = __dbg, H = D.HQ; Object.assign(D.TK, { x: (H.x0 + H.x1) / 2, z: (H.z0 + H.z1) / 2 }); });
  assert(await c.until(() => !__dbg.TUT.on && __dbg.TUT.done, null, { timeout: 8000 }), 'HQ did not finish the drill');
  const end = await c.js(() => ({ sc: __dbg.ST.scrap, mc: __dbg.mcOpen, tg: __dbg.TUT.tg.length, saved: JSON.parse(localStorage.getItem('sharotank_tut_v1') || '{}').done }));
  assert(end.sc === sc + 150 && end.tg === 0 && end.saved === 1, 'drill end: ' + JSON.stringify(end));
}

export const tests = [
  { name: 'new player: short start screen, full camp drill on a PC (keycaps, real shots), then «Продолжить»', timeout: 150, async run(ctx) {
    const c = await client({ name: 'tutpc', w: 1100, h: 640, start: false, tut: true }); ctx.clients.push(c);
    await c.page.waitForSelector('#bGo', { state: 'visible', timeout: 60000 });
    const s = await c.js(() => ({ fresh: document.querySelector('#help').classList.contains('fresh'), go: document.querySelector('#bGo').textContent, kv: !!document.querySelector('#help .kv'), reset: !!document.querySelector('#help #bReset') }));
    assert(s.fresh && s.go === 'Поехали' && !s.kv && !s.reset, 'new-player start screen: ' + JSON.stringify(s));
    assert(await V(c, '.stag'), 'no tagline for a new player');
    await c.page.click('#bGo');
    await c.until(() => __dbg.TUT.step === 0 && !document.querySelector('#tut').hidden, null, { timeout: 15000 });
    const k = await c.js(() => ({ pads: getComputedStyle(document.querySelector('#padL')).display, keys: [...document.querySelectorAll('#tut [data-k]')].map(k => k.dataset.k).join(), hand: document.querySelector('#tutHand').hidden }));
    assert(k.pads === 'none' && k.keys === 'KeyW,KeyA,KeyS,KeyD' && k.hand, 'PC drive prompt: ' + JSON.stringify(k));
    await c.page.keyboard.down('KeyW'); await c.wait(300);
    const lit = await c.js(() => document.querySelector('#tut [data-k="KeyW"]').classList.contains('on')); await c.page.keyboard.up('KeyW');
    assert(lit, 'pressed W does not light up');
    await c.shot('drive');
    await drill(c, false);
    // file:// storage does not survive a reload in headless Chromium, so the next visit is a new page carrying the saved flag
    const flag = await c.js(() => localStorage.getItem('sharotank_tut_v1'));
    const b = await client({ name: 'tutback', w: 1100, h: 640, start: false, tut: true, init: [f => { try { localStorage.setItem('sharotank_tut_v1', f); } catch (e) {} }, flag] }); ctx.clients.push(b);
    await b.page.waitForSelector('#bGo', { state: 'visible', timeout: 60000 });
    const r = await b.js(() => ({ fresh: document.querySelector('#help').classList.contains('fresh'), go: document.querySelector('#bGo').textContent }));
    assert(!r.fresh && r.go === 'Продолжить' && !(await V(b, '.stag')), 'returning start screen: ' + JSON.stringify(r));
    await b.shot('start-back');
    await b.page.click('#bGo'); await b.wait(3200);
    assert(!(await tst(b)).on, 'drill started again for a returning player');
  } },
  { name: 'phone: sticks shown, ghost thumb on the real stick, pulse on ОГОНЬ, full drill with touch', timeout: 150, async run(ctx) {
    const c = await client({ name: 'tutph', w: 800, h: 380, touch: true, start: false, tut: true }); ctx.clients.push(c);
    await c.page.waitForSelector('#bGo', { state: 'visible', timeout: 60000 }); await c.page.tap('#bGo');
    await c.until(() => __dbg.TUT.step === 0 && !document.querySelector('#tut').hidden, null, { timeout: 15000 }); await c.wait(700);
    const h = await c.js(() => { const a = document.querySelector('#tutHand'), s = document.querySelector('#moveStick').getBoundingClientRect(); return { kb: document.body.classList.contains('kbm'), hid: a.hidden, dx: Math.abs(parseFloat(a.style.left) - (s.left + s.width / 2)), dy: Math.abs(parseFloat(a.style.top) - (s.top + s.height / 2)), keys: document.querySelectorAll('#tut [data-k]').length }; });
    assert(!h.kb && !h.hid && h.dx < 2 && h.dy < 2 && h.keys === 0, 'ghost thumb: ' + JSON.stringify(h));
    const ov = await c.js(() => { const a = document.querySelector('#tut').getBoundingClientRect(), b = document.querySelector('#moveStick').getBoundingClientRect(), d = document.querySelector('#aimStick').getBoundingClientRect(); const hit = r => !(a.right <= r.left || a.left >= r.right || a.bottom <= r.top || a.top >= r.bottom); return hit(b) || hit(d); });
    assert(!ov, 'tutorial card covers a stick');
    await c.shot('drive');
    await c.js(() => { const D = __dbg; Object.assign(D.TK, { x: D.TUT_W1.x - 1, z: D.TUT_W1.z }); });
    await c.until(() => __dbg.TUT.step === 1, null, { timeout: 8000 }); await c.wait(400);
    assert(await c.js(() => document.querySelector('#bFire').classList.contains('tpulse') && document.querySelector('#tutHand').className.includes('aim')), 'aim step: no pulse on ОГОНЬ / thumb on the aim stick');
    await c.js(() => { const D = __dbg; Object.assign(D.TK, { x: 40, z: 44 }); D.TUT.step = -1; D.tutRestart(); });
    await drill(c, true);
  } },
  { name: 'skip, «Управление» instead of «Кнопки», reset behind a confirmation, PC never shows sticks', timeout: 120, async run(ctx) {
    const c = await client({ name: 'tutmenu', w: 1100, h: 640, start: false, tut: true }); ctx.clients.push(c);
    await c.page.waitForSelector('#bGo', { state: 'visible', timeout: 60000 }); await c.page.click('#bGo');
    await c.until(() => !document.querySelector('#tut').hidden, null, { timeout: 15000 });
    await c.page.click('#tutSkip'); await c.wait(300);
    const sk = await c.js(() => ({ on: __dbg.TUT.on, done: __dbg.TUT.done, tg: __dbg.TUT.tg.length, scrap: __dbg.ST.scrap }));
    assert(!sk.on && sk.done && sk.tg === 0 && sk.scrap === 1000, 'skip: ' + JSON.stringify(sk));
    await c.page.click('#bMenu'); await c.wait(300);
    assert(!(await c.js(() => !!document.querySelector('#bTouch'))) && await V(c, '#bCtrl'), 'menu still has «Кнопки»');
    assert(await c.js(() => getComputedStyle(document.querySelector('#padR')).display === 'none'), 'sticks appear on a PC after opening the menu');
    await c.page.click('#bCtrl'); await c.wait(200);
    assert(await V(c, '#ctrl') && await c.js(() => __dbg.ctrlOpen), '«Управление» did not open');
    await c.shot('ctrl');
    await c.page.keyboard.press('Escape'); await c.wait(200);
    assert(!(await V(c, '#ctrl')), 'Esc did not close «Управление»');
    await c.page.click('#bMenu'); await c.wait(200);
    await c.js(() => { __dbg.ST.scrap = 4321; __dbg.MS.i = 3; });
    await c.page.click('#bReset'); await c.wait(150);
    assert(await V(c, '#rConf') && await c.js(() => __dbg.ST.scrap === 4321), 'reset happened without confirmation');
    await c.page.click('#bResetN'); await c.wait(150);
    assert(!(await V(c, '#rConf')) && await c.js(() => __dbg.ST.scrap === 4321), 'cancel did not cancel');
    await c.page.click('#bReset'); await c.page.click('#bResetY'); await c.wait(300);
    const rs = await c.js(() => ({ scrap: __dbg.ST.scrap, i: __dbg.MS.i, done: __dbg.TUT.done, on: __dbg.TUT.on }));
    assert(rs.scrap === 1000 && rs.i === 0 && !rs.done && rs.on, 'reset: ' + JSON.stringify(rs));
    // touch on a touch laptop brings the sticks, a key hides them again
    await c.js(() => document.dispatchEvent(new PointerEvent('pointerdown', { pointerType: 'touch', bubbles: true })));
    const t1 = await c.js(() => getComputedStyle(document.querySelector('#padR')).display);
    await c.page.keyboard.press('KeyW');
    const t2 = await c.js(() => getComputedStyle(document.querySelector('#padR')).display);
    assert(t1 !== 'none' && t2 === 'none', `sticks on touch / key: ${t1} / ${t2}`);
  } },
  { name: 'players with a save from before v30.7 skip the drill; one-off hint on the first robot', timeout: 120, async run(ctx) {
    const a = await client({ name: 'tutsave' }); ctx.clients.push(a);
    const save = await a.until(() => localStorage.getItem('sharotank-5tl-v3'), null, { timeout: 40000 }); assert(save, 'no save written');
    const c = await client({ name: 'tutold', start: false, tut: true, init: [s => { try { if (!sessionStorage.getItem('x')) { localStorage.setItem('sharotank-5tl-v3', s); localStorage.removeItem('sharotank_tut_v1'); sessionStorage.setItem('x', 1); } } catch (e) {} }, save] }); ctx.clients.push(c);
    await c.page.waitForSelector('#bGo', { state: 'visible', timeout: 60000 });
    assert(await c.js(() => __dbg.TUT.done && document.querySelector('#bGo').textContent === 'Продолжить'), 'old save still gets the drill');
    await c.page.click('#bGo'); await c.wait(3000); assert(!(await tst(c)).on, 'drill started for an old save');
    await c.js(() => { __dbg.TUT.hints = {}; __dbg.goLocation('north', 'S'); });
    await c.until(() => !__dbg.transit && __dbg.LOC === 'north', null, { timeout: 30000 });
    await c.js(() => { const D = __dbg; D.TK.hp = 99999; const e = D.ENEMIES.find(x => !x.dead && !x.xf) || D.spawnEnemy('bull', D.TK.x + 4, D.TK.z + 14); e.x = D.TK.x + 4; e.z = D.TK.z + 14; window.__e = e; });
    assert(await c.until(() => __dbg.TUT.hint === 'lock' && !document.querySelector('#tut').hidden, null, { timeout: 8000 }), 'no lock hint near the first robot');
    await c.shot('hint');
    await c.js(() => { __dbg.AIM.manual = window.__e; }); await c.wait(800);
    assert(await c.js(() => !__dbg.TUT.hint && document.querySelector('#tut').hidden && __dbg.TUT.hints.lock === 1), 'lock hint did not go away after a manual lock');
  } }
];
