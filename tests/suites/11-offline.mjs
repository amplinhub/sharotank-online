/* Offline edition (build --mode offline → dist-offline, published to amplinhub/sharotank):
   no «С другом», «Водители», «Отладка»; a boss win offers nothing and queues nothing. */
import { client } from '../harness.mjs';
const assert = (c, m) => { if (!c) throw new Error(m); };
const shown = sel => { const e = document.querySelector(sel); return !!e && !e.hidden && getComputedStyle(e).display !== 'none' && e.getClientRects().length > 0; };

export const tests = [
  { name: 'offline build: no online, drivers, debug', timeout: 90, async run(ctx) {
    const c = await client({ name: 'offline', build: 'dist-offline', start: false }); ctx.clients.push(c);
    await c.page.waitForSelector('#bGo', { state: 'visible', timeout: 60000 }); // the start menu appears a moment after boot
    const v = await c.js(s => { const f = new Function('sel', 'return (' + s + ')(sel)'); return { cls: document.documentElement.className, go: f('#bGo'), on: f('#bOnline'), drv: f('#bDrv'), drv2: f('#bDrv2'), dbg: f('#bDbg') }; }, shown.toString());
    assert(v.cls === 'offline', 'no offline class: ' + v.cls);
    assert(v.go && !v.on && !v.drv, 'start menu buttons: ' + JSON.stringify(v));
    await c.js(() => document.querySelector('#bGo').click()); await c.wait(400);
    await c.js(() => document.querySelector('#bMenu') && document.querySelector('#bMenu').click()); await c.wait(400);
    const m = await c.js(s => { const f = new Function('sel', 'return (' + s + ')(sel)'); return { drv2: f('#bDrv2'), dbg: f('#bDbg'), dbgx: f('.dbgx') }; }, shown.toString());
    assert(!m.drv2 && !m.dbg && !m.dbgx, 'menu still has drivers/debug: ' + JSON.stringify(m));
    const w = await c.js(() => { const D = __dbg, e = { type: 'krot', bName: 'krot' }; D.DRV.fight = { e, t: 80, hp: D.TK.hp, lost: 0, kills: D.DRV.kills, max: 100 }; D.drvBossWin(e); return { q: D.DRV.q.length, offer: !document.querySelector('#drvOffer').hidden && getComputedStyle(document.querySelector('#drvOffer')).display !== 'none', best: !!D.DRV.best.krot }; });
    assert(w.q === 0 && !w.offer && w.best, 'boss win in offline edition: ' + JSON.stringify(w));
  } }
];
