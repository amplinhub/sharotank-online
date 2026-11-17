/* «РСЗО-537»: model parts, 120° MG arc, salvo with real falling rockets, stand-still rule, salvo stock, garage/motor-pool cards. */
import { client } from '../harness.mjs';
const assert = (c, m) => { if (!c) throw new Error(m); };

async function rszo(ctx, { abl = 0 } = {}) {
  const c = await client({ name: 'rszo' }); ctx.clients.push(c);
  await c.js(a => { const D = __dbg; D.ST.scrap = 99999; D.UP.tanks.rszo = 1; D.selectTank('rszo'); D.UP.abl = a; D.buildGameTank(); D.updateWeaponUI(); }, abl);
  await c.js(() => __dbg.goLocation('junk', 'N'));
  await c.until(() => !__dbg.transit && __dbg.LOC === 'junk', null, { timeout: 30000 }); await c.wait(600);
  await c.js(() => { const D = __dbg; for (const e of D.ENEMIES) if (!e.dead) D.eRemove(e); Object.assign(D.TK, { x: 60, z: 95, h: 0, tYaw: 0, vx: 0, vz: 0, vF: 0, hp: 9999 }); D.ST.ammo.sv = 3; D.MLRS.cd = 0; });
  return c;
}

export const tests = [
  { name: 'rszo: model, weapons, 120° MG arc', timeout: 90, async run(ctx) {
    const c = await rszo(ctx, { abl: 2 });
    const m = await c.js(() => { const D = __dbg, T = D.tank; return { wheels: T.wheels.length, bogies: (T.bogies || []).length, tubes: T.rszMuz.length, mg: T.mgMuz.length, w: D.WEAP.length, cnVis: T.cn.visible, mgVis: T.mg.visible }; });
    assert(m.wheels === 8 && m.bogies === 2, 'wheels/bogies: ' + JSON.stringify(m));
    assert(m.tubes === 8, 'abl 2 must give 8 tubes: ' + m.tubes);
    assert(m.mg === 1 && m.mgVis && !m.cnVis, 'starts with one MG barrel, no cannon: ' + JSON.stringify(m));
    // aim straight behind: the mount must stop at ±60°, and the MG must not fire into its dead zone
    await c.js(() => { const D = __dbg; D.AIM.manual = null; D.AIM.lockE = null; D.AIM.x = D.TK.x; D.AIM.z = D.TK.z - 30; D.AIM.yawRel = Math.PI; });
    await c.wait(1500);
    const a = await c.js(() => Math.abs(__dbg.tank.turret.rotation.y));
    assert(a <= Math.PI / 3 + 0.01, 'turret left the 120° arc: ' + a);
  } },
  { name: 'rszo: salvo kills a «Бизон» with real rockets, uses stock, cooldown', timeout: 120, async run(ctx) {
    const c = await rszo(ctx);
    await c.js(() => { const D = __dbg, e = D.spawnEnemy('bull', 60, 117); e.speedW = 0; e.acc = 0; e.turn = 0; });
    await c.wait(300);
    const s = await c.js(() => { const D = __dbg; D.AIM.lockE = D.ENEMIES.find(x => x.type === 'bull' && !x.dead); D.mlrsPress(); return { st: D.MLRS.st, sv: D.ST.ammo.sv, N: D.MLRS.N }; });
    assert(s.st === 'raise' && s.sv === 2 && s.N === 4, 'salvo did not start: ' + JSON.stringify(s));
    const up = await c.until(() => __dbg.MLRS.list.length > 0 && __dbg.tank.rszPod.rotation.x < -0.8, null, { timeout: 20000 });
    assert(up, 'pack did not rise / no rockets launched');
    await c.js(() => __dbg.mlrsPress()); // second press during the salvo: ignored
    const done = await c.until(() => __dbg.MLRS.st === 'idle' && __dbg.MLRS.list.length === 0, null, { timeout: 45000 });
    assert(done, 'salvo never finished');
    const r = await c.js(() => { const D = __dbg, e = D.ENEMIES.find(x => x.type === 'bull'); return { dead: !e || e.dead, hp: e && e.hp, sv: D.ST.ammo.sv, pod: D.tank.rszPod.rotation.x }; });
    assert(r.sv === 2, 'second press must not spend a salvo: ' + r.sv);
    assert(Math.abs(r.pod) < 0.01, 'pack did not come down: ' + r.pod);
    // scatter is random by design: require a kill or at least 60% of its 160 hp gone
    assert(r.dead || r.hp < 64, '4-rocket salvo barely hurt a standing «Бизон», hp left ' + r.hp);
  } },
  { name: 'rszo: no salvo while driving fast or without stock', timeout: 90, async run(ctx) {
    const c = await rszo(ctx);
    const a = await c.js(() => { const D = __dbg; D.TK.vF = 6; D.TK.vz = 6; D.mlrsPress(); return D.MLRS.st; });
    assert(a === 'idle', 'fired while moving at 6 m/s');
    const b = await c.js(() => { const D = __dbg; D.TK.vF = 0; D.TK.vx = D.TK.vz = 0; D.ST.ammo.sv = 0; D.mlrsPress(); return D.MLRS.st; });
    assert(b === 'idle', 'fired with an empty salvo stock');
  } },
  { name: 'rszo: motor pool and garage cards', timeout: 90, async run(ctx) {
    const c = await client({ name: 'rszo-gar' }); ctx.clients.push(c);
    await c.js(() => { __dbg.ST.scrap = 5000; __dbg.openGarage('park'); });
    await c.until(() => __dbg.GAR.open, null, { timeout: 10000 }); await c.wait(500);
    const park = await c.js(() => document.querySelector('#gUps').textContent);
    assert(/РСЗО-537/.test(park) && /3200/.test(park), 'РСЗО-537 for 3200 missing in the motor pool');
    await c.js(() => document.querySelector('[data-tkbuy="rszo"]').click()); await c.wait(400);
    const own = await c.js(() => ({ tank: __dbg.UP.tank, scrap: __dbg.ST.scrap, mg: __dbg.UP.mg }));
    assert(own.tank === 'rszo' && own.scrap === 1800 && own.mg === 'dshk1', 'buying failed: ' + JSON.stringify(own));
    await c.js(() => __dbg.closeGarage()); await c.wait(600); await c.js(() => __dbg.openGarage('gar')); await c.until(() => __dbg.GAR.open, null, { timeout: 10000 }); await c.wait(500);
    const gar = await c.js(() => document.querySelector('#gUps').textContent);
    assert(/Пакет РСЗО/.test(gar) && /4 ракет в залпе/.test(gar), 'ability upgrade card missing');
    assert(/залпа РСЗО/.test(gar), 'salvo stock missing from «Боеукладка»');
    assert(/Спарка ДШК/.test(gar) && !/Миниган/.test(gar), 'MG choice must be ДШК / спарка ДШК only');
    assert(!/Калибр пушки|Ракетный блок/.test(gar), 'cannon/rocket-pod upgrades must be hidden');
  } }
];
