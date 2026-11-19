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
  { name: 'rszo: model, weapons, 360° MG that never goes through the truck', timeout: 120, async run(ctx) {
    const c = await rszo(ctx, { abl: 2 });
    const m = await c.js(() => { const D = __dbg, T = D.tank; return { wheels: T.wheels.length, bogies: (T.bogies || []).length, tubes: T.rszMuz.length, mg: T.mgMuz.length, w: D.WEAP.length, cnVis: T.cn.visible, mgVis: T.mg.visible }; });
    assert(m.wheels === 8 && m.bogies === 2, 'wheels/bogies: ' + JSON.stringify(m));
    assert(m.tubes === 8, 'abl 2 must give 8 tubes: ' + m.tubes);
    assert(m.mg === 1 && m.mgVis && !m.cnVis, 'starts with one MG barrel, no cannon: ' + JSON.stringify(m));
    // aim straight behind and low: the mount turns all the way round
    await c.js(() => { const D = __dbg, e = D.spawnEnemy('bull', D.TK.x, D.TK.z - 22); e.speedW = 0; e.acc = 0; e.turn = 0; D.AIM.manual = e; });
    await c.wait(2500);
    const a = await c.js(() => Math.abs(__dbg.wrapA ? __dbg.wrapA(__dbg.tank.turret.rotation.y) : __dbg.tank.turret.rotation.y));
    assert(a > 2.6, 'turret did not turn to the rear: ' + a);
    // every direction, pack down and raised: the barrel and its fire line clear the truck's own meshes at the lowest allowed pitch
    const bad = await c.js(() => { const D = __dbg, T = D.tank, TH = THREE, out = [];
      for (const ang of [0, 1]) { D.MLRS.ang = ang; T.rszPod.rotation.x = -ang * 0.95; T.root.updateMatrixWorld(true);
        const meshes = []; T.root.traverse(o => { if (!o.isMesh) return; let p = o; while (p) { if (p === T.stab || p.visible === false) return; p = p.parent; } meshes.push(o); });
        const piv = new TH.Vector3(), q = new TH.Quaternion(); T.root.getWorldQuaternion(q); const rc = new TH.Raycaster(), y0 = T.turret.rotation.y, g0 = T.gun.rotation.x;
        for (let deg = 0; deg < 360; deg += 3) { const y = deg * Math.PI / 180, p = D.CHASSIS.rszo.dep(y); T.turret.rotation.y = y; T.gun.rotation.x = 0; T.root.updateMatrixWorld(true); T.gun.getWorldPosition(piv);
          const dl = new TH.Vector3(Math.sin(y) * Math.cos(p), Math.sin(p), Math.cos(y) * Math.cos(p)).applyQuaternion(q), tl = new TH.Vector3(-Math.cos(y), 0, Math.sin(y)).applyQuaternion(q);
          for (const off of T.mgMuz.length > 1 ? [-0.12, 0.12] : [0]) { rc.set(piv.clone().addScaledVector(tl, off).addScaledVector(dl, 0.12), dl); rc.far = 8; const h = rc.intersectObjects(meshes, false); if (h.length) out.push(`${ang ? 'up' : 'down'} ${deg}° at ${h[0].distance.toFixed(2)} m`); } }
        T.turret.rotation.y = y0; T.gun.rotation.x = g0; }
      D.MLRS.ang = 0; T.rszPod.rotation.x = 0; return out; });
    assert(!bad.length, 'barrel / fire line hits the truck: ' + bad.slice(0, 8).join(', '));
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
  { name: 'rszo: salvo on the move (no slowdown), none without stock', timeout: 90, async run(ctx) {
    const c = await rszo(ctx);
    const a = await c.js(() => { const D = __dbg; D.TK.vF = 6; D.TK.vz = 6; D.mlrsPress(); return { st: D.MLRS.st, k: D.mlrsVK() }; });
    assert(a.st === 'raise' && a.k === 1, 'no salvo / slowdown at 6 m/s: ' + JSON.stringify(a));
    await c.until(() => __dbg.MLRS.st === 'idle', null, { timeout: 30000 });
    const b = await c.js(() => { const D = __dbg; D.MLRS.cd = 0; D.TK.vF = 0; D.TK.vx = D.TK.vz = 0; D.ST.ammo.sv = 0; D.mlrsPress(); return D.MLRS.st; });
    assert(b === 'idle', 'fired with an empty salvo stock');
    const cap = await c.js(() => __dbg.AMMO_CAP.sv.join(','));
    assert(cap === '9,11,13,15', 'salvo stock must be 9/11/13/15: ' + cap);
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
  } },
  { name: 'rszo: the cab MG actually hits robots close by on every side (pedestal, v30.5)', timeout: 150, async run(ctx) {
    const c = await rszo(ctx);
    const res = [];
    /* the spot is clear of junk on every side (checked with raycast) — earlier misses were bullets hitting scenery */
    for (const [dx, dz, tag] of [[7, 1, 'side 7 m'], [-6, -7, 'rear-left 9 m'], [0, 7, 'front 7 m'], [-13, 3, 'side 13 m'], [4, -10, 'rear 11 m']]) {
      await c.js(([dx, dz]) => { const D = __dbg; for (const e of D.ENEMIES) if (!e.dead) D.eRemove(e); Object.assign(D.TK, { x: 80, z: 70, h: 0, vx: 0, vz: 0, vF: 0 }); D.ST.ammo.mg = 9999;
        const e = D.spawnEnemy('bull', D.TK.x + dx, D.TK.z + dz); e.speedW = 0; e.acc = 0; e.turn = 0; e.hp = e.maxHp = 5000; e.cd = 99; e.state = 'idle'; e.aggro = false; window.__t = e; window.__hits = 0; e.onHit = () => { window.__hits++; }; D.AIM.manual = e; D.AIM.lockE = e; }, [dx, dz]);
      await c.wait(1200); await c.page.keyboard.down('KeyF'); await c.wait(2500); await c.page.keyboard.up('KeyF');
      res.push([tag, await c.js(() => window.__hits)]); /* v30.8: count hits — a robot on alert turns its armoured front, damage alone is noisy */
    }
    const bad = res.filter(r => r[1] < 5);
    assert(!bad.length, 'MG barely hurt: ' + JSON.stringify(res));
  } }
];
