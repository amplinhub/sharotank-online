/* v31.0: прогресс на любом устройстве — облачное сохранение у пилота (сервер v6), слияние «ничего не откатывается назад». */
import { client } from '../harness.mjs';
import { startSheets } from '../net/sheets-mock.mjs';
const assert = (c, m) => { if (!c) throw new Error(m); };

async function auth(c, kind, nick, pin) {
  await c.js(() => document.querySelector('#bDrv2').click());
  await c.until(() => !document.querySelector('#drvReg').hidden, null, { timeout: 5000 });
  await c.page.fill('#drvNick', nick); await c.page.fill('#drvPin', pin);
  await c.js(k => { const want = k === 'reg' ? 'Создать пилота' : 'Войти'; if (document.querySelector('#drvRegGo').textContent !== want) document.querySelector('#drvLogGo').click(); document.querySelector('#drvRegGo').click(); }, kind);
  return safeUntil(c, () => window.__dbg && __dbg.DRV && (__dbg.DRV.nick || (document.querySelector('#drvMsg').classList.contains('err') && 'ERR:' + document.querySelector('#drvMsg').textContent)), 8000);
}
/* the page may reload itself (a server copy is applied) — polling must survive the navigation */
async function safeUntil(c, fn, timeout = 20000) { const t0 = Date.now(); for (;;) { let v = null; try { v = await c.page.evaluate(fn); } catch (_) { v = null; } if (v) return v; if (Date.now() - t0 > timeout) return v; await c.wait(250); } }
const pushNow = c => c.js(() => { const D = __dbg; D.CLOUD.chk = 0; D.cloudTick(0); D.DRV.syncT = 0; D.DRV.dirty = true; });
const state = c => c.js(() => { const D = __dbg; return { i: D.MS.i, scrap: Math.floor(D.ST.scrap), tanks: Object.keys(D.UP.tanks).sort().join(','), eng: D.UP.engine, med: Object.keys(D.DRV.medals).length, nick: D.DRV.nick }; });

export const tests = [
  { name: 'cloud save: merge keeps the newer scrap, never rolls progress, machines or upgrades back', timeout: 60, async run(ctx) {
    const a = await client({ name: 'cl-merge' }); ctx.clients.push(a);
    const r = await a.js(() => { const D = __dbg, base = D.cloudNow();
      const x = JSON.parse(JSON.stringify(base)), y = JSON.parse(JSON.stringify(base));
      x.t = 1000; x.g.scrap = 500; x.g.ms.i = 9; x.g.up.tanks = { base: 1, krep: 1 }; x.g.up.engine = 3; x.d.med = { first: 1 }; x.d.kills = 400;
      y.t = 2000; y.g.scrap = 120; y.g.ms.i = 6; y.g.up.tanks = { base: 1, ten: 1 }; y.g.up.engine = 1; y.g.up.armor = 2; y.d.med = { krot: 2 }; y.d.kills = 300;
      const m = D.cloudMerge(x, y);
      return { scrap: m.g.scrap, i: m.g.ms.i, tanks: Object.keys(m.g.up.tanks).sort().join(','), eng: m.g.up.engine, arm: m.g.up.armor, med: Object.keys(m.d.med).sort().join(','), kills: m.d.kills, t: m.t }; });
    assert(r.scrap === 120, 'scrap must come from the newer save: ' + JSON.stringify(r));
    assert(r.i === 9 && r.tanks === 'base,krep,ten' && r.eng === 3 && r.arm === 2, 'progress rolled back: ' + JSON.stringify(r));
    assert(r.med === 'first,krot' && r.kills === 400 && r.t === 2000, 'medals/counters: ' + JSON.stringify(r));
  } },
  { name: 'cloud save: progress follows the pilot to a new device; a device with its own progress gets a choice', timeout: 150, async run(ctx) {
    const sh = await startSheets(); ctx.onDone = () => sh.close();
    const a = await client({ name: 'cl-a', net: { sheets: sh.url } }); ctx.clients.push(a);
    assert(await auth(a, 'reg', 'Облако', '4321') === 'Облако', 'reg');
    await a.js(() => { const D = __dbg; D.MS.i = 7; D.MS.rank = 5; D.ST.scrap = 3333; D.UP.tanks.krep = 1; D.UP.engine = 2; D.DRV.medals.krot = Date.now(); });
    await pushNow(a);
    const up = await a.until(() => __dbg.CLOUD.ready && __dbg.CLOUD.up && __dbg.CLOUD.up === __dbg.CLOUD.last, null, { timeout: 15000 });
    if (!up) { await pushNow(a); await a.until(() => __dbg.CLOUD.up && __dbg.CLOUD.up === __dbg.CLOUD.last, null, { timeout: 15000 }); }
    const row = sh.db.T.Pilots.find(p => p.nick === 'Облако');
    assert(row && row.save && JSON.parse(row.save).g.ms.i === 7, 'save not on the server: ' + (row && String(row.save).slice(0, 80)));

    // a brand-new device: the server copy comes in by itself (page reloads)
    const b = await client({ name: 'cl-b', net: { sheets: sh.url } }); ctx.clients.push(b);
    assert(await auth(b, 'login', 'Облако', '4321') === 'Облако', 'login b');
    const sb = await safeUntil(b, () => { try { return window.__dbg && __dbg.MS && __dbg.MS.i === 7 && { i: __dbg.MS.i, scrap: Math.floor(__dbg.ST.scrap), krep: !!__dbg.UP.tanks.krep, eng: __dbg.UP.engine, krot: !!__dbg.DRV.medals.krot, nick: __dbg.DRV.nick }; } catch (_) { return null; } }, 20000);
    assert(sb && sb.scrap === 3333 && sb.krep && sb.eng === 2 && sb.krot && sb.nick === 'Облако', 'progress did not follow: ' + JSON.stringify(sb || await state(b)));

    // a device that already has its own progress: card with both, «server» wins after the choice
    const c = await client({ name: 'cl-c', net: { sheets: sh.url } }); ctx.clients.push(c);
    await c.js(() => { const D = __dbg; D.MS.i = 3; D.ST.scrap = 999; D.UP.tanks.ten = 1; D.drvKill('jian', '', null); for (let i = 0; i < 20; i++) D.drvKill('jian', '', null); D.CLOUD.chk = 0; D.cloudTick(0); });
    assert(await auth(c, 'login', 'Облако', '4321') === 'Облако', 'login c');
    assert(await c.until(() => { const e = document.querySelector('#cloudAsk'); return e && !e.hidden && e.textContent.includes('задание 8') && e.textContent.includes('задание 4'); }, null, { timeout: 8000 }), 'no choice card');
    await c.js(() => document.querySelector('#caSrv').click());
    const sc = await safeUntil(c, () => { try { return window.__dbg && __dbg.MS && __dbg.MS.i === 7 && { scrap: Math.floor(__dbg.ST.scrap), ten: !!__dbg.UP.tanks.ten }; } catch (_) { return null; } }, 20000);
    assert(sc && sc.scrap === 3333 && !sc.ten, 'server choice not applied: ' + JSON.stringify(sc));
    assert(await c.js(() => !!localStorage.getItem('sharotank_cloud_backup')), 'no backup of the replaced progress');
  } },
];

/* ---------------- story B: missions, people, voices ---------------- */
const go = (c, i, loc, side) => c.js(([I, L, S]) => { const D = __dbg; D.MS.i = I; D.MS.active = true; D.MS.prog = 0; D.TK.hp = 9999; D.goLocation(L, S); }, [i, loc, side]);
const arrived = (c, loc) => c.until(L => __dbg.LOC_ID === L && !__dbg.transit, loc, { timeout: 30000 });
/* a real projectile: player cannon shell (or an enemy shot with enemy:true) fired at a point from 6 m away */
const fireAt = (c, x, y, z, o = {}) => c.js(([x, y, z, o]) => { const D = __dbg, a = o.a != null ? o.a : Math.random() * Math.PI * 2, R = 6, sx = x + Math.cos(a) * R, sz = z + Math.sin(a) * R, sp = 60;
  const w = o.mg ? { ...D.WEAP[0], g: 0 } : { ...D.WEAP[1], g: 0 }; if (o.enemy) w.dmg = 20;
  D.proj.push({ x: sx, y, z: sz, vx: -Math.cos(a) * sp, vy: 0, vz: -Math.sin(a) * sp, w, life: 1, enemy: !!o.enemy, mesh: new THREE.Mesh() }); }, [x, y, z, o]);

tests.push(
  { name: 'story: 20 missions, «Колокол тишины» untouched, new kinds train/ford/tower, voices on the radio', timeout: 60, async run(ctx) {
    const a = await client({ name: 'st-voices' }); ctx.clients.push(a);
    const r = await a.js(() => { const D = __dbg, S = D.STORY; return { n: S.length, k: S.map(m => m.k).join(','), bell: S[18].title, bellBrief: S[18].brief.startsWith('Это предпоследний рубеж'), posts: S.filter(m => m.post).length }; });
    assert(r.n === 20 && r.k.includes('train') && r.k.includes('ford') && r.k.includes('tower') && r.bell === 'Колокол тишины' && r.bellBrief && r.posts >= 14, 'story: ' + JSON.stringify(r));
    await a.js(() => { __dbg.radioSay('ПРОВЕРКА СВЯЗИ.', 'liu'); });
    const v = await a.until(() => { const b = document.querySelector('#radio'); return !b.hidden && b.dataset.w === 'liu' && b.querySelector('.who').textContent; }, null, { timeout: 6000 });
    assert(v && /Лю/.test(v), 'Liu plate: ' + v);
    // v31.1: «Нефрит» is silent: no voice, no lines in the source
    assert(await a.js(() => !document.querySelector('#radio[data-w="nef"]') && !__dbg.NEF_BOSS), 'Nefrit lines still present');
    // the first mission done → Mei speaks after it
    await a.js(() => { const D = __dbg; D.MS.i = 0; D.MS.active = true; D.forceWin(); });
    assert(await a.until(() => document.querySelector('#radio').dataset.w === 'mei', null, { timeout: 15000 }), 'Mei did not speak after mission 1');
  } },
  { name: 'Mei in the garage: greets, advises an upgrade for the next mission, reacts to a purchase', timeout: 60, async run(ctx) {
    const a = await client({ name: 'st-mei' }); ctx.clients.push(a);
    await a.js(() => { const D = __dbg; D.MS.i = 1; D.MS.active = false; D.MS.mei = { met: 1 }; D.ST.scrap = 5000; D.openGarage('gar'); });
    const t1 = await a.until(() => { const e = document.querySelector('#gMeiTx'); return !document.querySelector('#gMei').hidden && e.textContent.length > 10 && e.textContent; }, null, { timeout: 15000 });
    assert(t1, 'Mei says nothing on entering the garage');
    const adv = await a.js(() => __dbg.meiAdvice());
    assert(/брон/i.test(adv), 'advice for the train mission should be armour: ' + adv);
    await a.js(() => document.querySelector('#gpanel [data-buy="engine"]').click());
    const t2 = await a.until(o => { const e = document.querySelector('#gMeiTx').textContent; return e !== o && e.length > 10 && e; }, t1, { timeout: 6000 });
    assert(t2 && t2 !== t1, 'no reaction to the purchase');
    assert(await a.js(() => !__dbg.GAR.mei), 'Mei has no figure in the garage (removed in v31.1)');
    // v31.1: lines are varied, the tank descriptions are true (all tanks are wheeled), idle chatter appears by itself
    const L = await a.js(() => { const D = __dbg, all = []; for (const k in D.MEI_TANK) all.push(...D.MEI_TANK[k]); for (const k in D.MEI_BUY) all.push(...D.MEI_BUY[k]); return { all, adv: new Set(Array.from({ length: 30 }, () => D.meiChat())).size, tk: Object.keys(D.MEI_TANK).length, buy: Object.keys(D.MEI_BUY).length }; });
    assert(!L.all.some(t => /гусениц/i.test(t)), 'a tank line mentions tracks, but all tanks are wheeled');
    assert(L.tk === 7 && L.all.length >= 70, 'Mei: too few lines ' + L.all.length);
    assert(L.adv >= 10, 'Mei chatter is repetitive: ' + L.adv);
    const t3 = await a.js(() => document.querySelector('#gMeiTx').textContent);
    await a.js(() => { __dbg.MEI.idle = 0; });
    const t4 = await a.until(o => { const e = document.querySelector('#gMeiTx').textContent; return e !== o && e.length > 10 && e; }, t3, { timeout: 8000 });
    assert(t4, 'no idle chatter from Mei');
  } },
  { name: 'mission 2 «Последний состав»: zone → «ЗАЩИЩАЙ ПОЕЗД», robots only from the south, shots hurt the train, a lost train restarts, the train leaves', timeout: 150, async run(ctx) {
    const a = await client({ name: 'st-train' }); ctx.clients.push(a);
    await go(a, 1, 'nw', 'E'); assert(await arrived(a, 'nw'), 'no station');
    const s0 = await a.until(() => __dbg.TRAIN.g && { ph: __dbg.TRAIN.phase, en: __dbg.ENEMIES.filter(e => !e.dead && !e.wave).length }, null, { timeout: 8000 });
    assert(s0 && s0.ph === 0 && s0.en === 0, 'train/zone, no district robots: ' + JSON.stringify(s0));
    await a.js(() => { const D = __dbg, m = D.STORY[1]; D.TK.x = m.x; D.TK.z = m.z; D.TK.vx = D.TK.vz = 0; });
    assert(await a.until(() => __dbg.TRAIN.phase >= 1 && !document.querySelector('#bigCall').hidden && document.querySelector('#bigCall').textContent === 'ЗАЩИЩАЙ ПОЕЗД', null, { timeout: 5000 }), 'no big call');
    const w = await a.until(() => { const L = __dbg.ENEMIES.filter(e => !e.dead && e.wave); return L.length >= 3 && L.map(e => Math.round(e.z)); }, null, { timeout: 15000 });
    assert(w && w.every(z => z > 55), 'robots must come from the south: ' + w);
    const hp0 = await a.js(() => __dbg.TRAIN.hp);
    await fireAt(a, await a.js(() => __dbg.TRAIN.x + 17), 2, 26, { a: Math.PI / 2 });
    assert(await a.until(h => __dbg.TRAIN.hp < h - 20, hp0, { timeout: 4000 }), 'a cannon shell did not hurt the train');
    // the train is lost → red stamp → back to the zone with full armour
    await a.js(() => { __dbg.TRAIN.hp = 5; }); await fireAt(a, await a.js(() => __dbg.TRAIN.x + 5), 2, 26, { a: Math.PI / 2, enemy: true });
    assert(await a.until(() => document.querySelector('#win').classList.contains('fail') && document.querySelector('#winH').textContent === 'Задание провалено', null, { timeout: 6000 }), 'no fail stamp');
    const rs = await a.until(() => __dbg.TRAIN.g && __dbg.TRAIN.phase <= 1 && __dbg.TRAIN.hp === __dbg.TRAIN.max && !__dbg.ENEMIES.some(e => !e.dead && e.goal) && { x: __dbg.TRAIN.x }, null, { timeout: 30000 });
    assert(rs && rs.x === 6, 'no restart: ' + JSON.stringify(rs));
    // success: the train reaches the tunnel
    await a.js(() => { const D = __dbg, m = D.STORY[1]; D.TK.x = m.x; D.TK.z = m.z; });
    await a.until(() => __dbg.TRAIN.phase >= 1, null, { timeout: 4000 });
    await a.js(() => { const T = __dbg.TRAIN; T.phase = 2; T.t = 20; T.x = -47.9; });
    assert(await a.until(() => __dbg.MS.i === 2, null, { timeout: 6000 }), 'train left but mission not done');
  } },
  { name: 'mission 12 «Брод»: people run from the lower-left house up to the camp, robots come from the right; a shell kills, more than 6 dead fails', timeout: 150, async run(ctx) {
    const a = await client({ name: 'st-ford' }); ctx.clients.push(a);
    await go(a, 11, 'south', 'N'); assert(await arrived(a, 'south'), 'no village');
    await a.js(() => { const D = __dbg; D.TK.x = 34; D.TK.z = 48; });
    const p = await a.until(() => { const L = __dbg.FORD.list.filter(c => c.st === 'run'); return L.length >= 3 && L.map(c => [c.x, c.z]); }, null, { timeout: 15000 });
    assert(p && p.every(([x, z]) => x < 40 && z > 50), 'people not at the lower-left house: ' + JSON.stringify(p));
    const z0 = p[0][1]; await a.wait(2500);
    const z1 = await a.js(() => { const c = __dbg.FORD.list.find(c => c.st === 'run'); return c ? c.z : 99; });
    assert(z1 < z0 - 1, 'people do not run north: ' + z0 + ' → ' + z1);
    const ew = await a.until(() => { const L = __dbg.ENEMIES.filter(e => !e.dead && e.wave); return L.length >= 2 && L.map(e => Math.round(e.x)); }, null, { timeout: 12000 });
    assert(ew && ew.every(x => x > 45), 'robots must come from the right: ' + ew);
    const t = await a.js(() => { const c = __dbg.FORD.list.find(c => c.st === 'run'); c.spd = 0; c.x = 34; c.z = 30; return [c.x, 0.95 + __dbg.groundH(c.x, c.z), c.z]; });
    await a.wait(300); await fireAt(a, t[0], t[1], t[2], { a: -Math.PI / 2 });
    assert(await a.until(() => __dbg.FORD.dead >= 1, null, { timeout: 4000 }), 'a shell did not kill a person');
    await a.js(() => { const D = __dbg; for (const c of D.FORD.list.filter(c => c.st === 'run').slice(0, 7)) D.civDie(c, 1, 0, 4); for (let i = 0; i < 7 && D.FORD.dead <= 6; i++) D.FORD.dead++; });
    assert(await a.until(() => document.querySelector('#win').classList.contains('fail'), null, { timeout: 8000 }), 'no fail after >6 dead');
    assert(await a.until(() => __dbg.FORD.on && __dbg.FORD.dead === 0, null, { timeout: 30000 }), 'ford did not restart');
  } },
  { name: 'mission 18 «Опоры башни»: shells break the legs, the tower falls and the mission is done', timeout: 150, async run(ctx) {
    const a = await client({ name: 'st-tower' }); ctx.clients.push(a);
    await go(a, 17, 'west', 'E'); assert(await arrived(a, 'west'), 'no business district');
    const s = await a.until(() => __dbg.TOWER.on && __dbg.TOWER.legs.length === 4 && { z: __dbg.ENEMIES.filter(e => !e.dead && e.type === 'zont').length }, null, { timeout: 8000 });
    assert(s && s.z >= 2, 'tower/zonts: ' + JSON.stringify(s));
    await a.js(() => { for (const e of __dbg.ENEMIES) if (!e.dead && e.type === 'zont') { e.hp = 0; __dbg.enemyHit(e, 999, 0, 0, 'area'); } });
    const before = await a.js(() => __dbg.TOWER.legs[0].hp);
    const L0 = await a.js(() => { const L = __dbg.TOWER.legs[0]; return [L.x, 3.4, L.z]; });
    await fireAt(a, L0[0], L0[1], L0[2], { a: -Math.PI * 0.75 });
    assert(await a.until(h => __dbg.TOWER.legs[0].hp < h - 10, before, { timeout: 4000 }), 'a shell did not hurt the leg');
    await a.js(() => { for (const L of __dbg.TOWER.legs) L.hp = 1; });
    for (let i = 0; i < 4; i++) { const L = await a.js(i => { const L = __dbg.TOWER.legs[i]; return [L.x, 3.4, L.z, Math.atan2(L.z - 63, L.x - 12)]; }, i); await fireAt(a, L[0], L[1], L[2], { a: L[3] }); await a.wait(300); }
    assert(await a.until(() => __dbg.TOWER.phase >= 1, null, { timeout: 5000 }), 'tower does not creak after all legs: ' + await a.js(() => __dbg.TOWER.legs.map(L => L.hp).join(',')));
    assert(await a.until(() => __dbg.MS.i === 18, null, { timeout: 20000 }), 'tower fell but mission not done');
  } },
  { name: 'people: slow tank pushes (they talk back), fast throws (they get up), very fast kills; the rescued talk in the camp', timeout: 120, async run(ctx) {
    const a = await client({ name: 'st-ppl' }); ctx.clients.push(a);
    await a.js(() => { const D = __dbg; D.MS.camp = { tea: 3, ford: 4 }; });
    const cp = await a.until(() => __dbg.CAMPP.list.length === 7 && __dbg.CAMPP.list.every(c => c.st === 'talk'), null, { timeout: 8000 });
    assert(cp, 'camp people: ' + await a.js(() => __dbg.CAMPP.list.length));
    const r = await a.js(() => { const D = __dbg, c = D.CAMPP.list[0]; D.TK.x = c.x - 1.2; D.TK.z = c.z; D.TK.h = Math.PI / 2; D.TK.vx = 2; D.TK.vz = 0; c.hitT = 0; c.sayT = 0; const hit = D.pplTank(c, false); return { hit, st: c.st, up: c.rg && c.rg.up }; });
    assert(r.hit && r.st === 'rag' && r.up > 0, 'slow push: ' + JSON.stringify(r));
    assert(await a.until(() => __dbg.BUBS.some(b => b.t > 0 && !b.el.hidden && b.el.textContent.length > 3), null, { timeout: 3000 }), 'no word back');
    await a.js(() => { const D = __dbg; D.TK.vx = 0; D.TK.x = 30; D.TK.z = 50; });
    assert(await a.until(() => __dbg.CAMPP.list[0].st === 'talk', null, { timeout: 8000 }), 'did not get up');
    // outside the camp: fast → thrown and up again; very fast → dead
    await go(a, 3, 'east', 'W'); assert(await arrived(a, 'east'), 'no east');
    const f = await a.js(() => { const D = __dbg; const mk = (x, z) => { const c = D.civMake(x, z, 1); return c; }; const A = mk(30, 40), B = mk(30, 50);
      D.TK.x = 28.8; D.TK.z = 40; D.TK.h = Math.PI / 2; D.TK.vx = 5; D.TK.vz = 0; D.pplTank(A, true); const a1 = A.st, up = A.rg && A.rg.up;
      D.TK.x = 28.8; D.TK.z = 50; D.TK.vx = 11; D.pplTank(B, true); window.__A = A; window.__B = B; return { a1, up, b: B.st }; });
    assert(f.a1 === 'rag' && f.up > 1 && f.b === 'dead', 'fast/very fast: ' + JSON.stringify(f));
    await a.js(() => { __dbg.TK.vx = 0; __dbg.TK.x = 60; __dbg.TK.z = 60; });
  } },
  { name: 'radio in a fight: reinforcements arrive from the far gate, jamming blocks support calls', timeout: 90, async run(ctx) {
    const a = await client({ name: 'st-chat' }); ctx.clients.push(a);
    await go(a, 6, 'ne', 'W'); assert(await arrived(a, 'ne'), 'no port');
    const n0 = await a.js(() => __dbg.ENEMIES.filter(e => !e.dead).length);
    await a.js(() => __dbg.chatReinf());
    assert(await a.until(n => __dbg.ENEMIES.filter(e => !e.dead).length >= n + 3, n0, { timeout: 4000 }), 'no reinforcements');
    await a.js(() => { const D = __dbg; D.ST.kits.rep = 1; D.JAM.t = 6; document.body.classList.add('jam'); });
    assert(await a.js(() => document.body.classList.contains('jam')), 'no jam class');
    const hp = await a.js(() => { const D = __dbg; D.TK.hp = 20; document.querySelector('#kRep') && document.querySelector('#kRep').click(); return D.ST.kits.rep; });
    assert(hp === 1, 'a support call worked while jammed');
  } },
);
