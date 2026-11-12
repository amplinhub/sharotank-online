import { client } from '../harness.mjs';
const assert = (c, m) => { if (!c) throw new Error(m); };

export const tests = [
  { name: 'boots to the camp without errors', async run(ctx) {
    const c = await client({ name: 'boot', start: false }); ctx.clients.push(c);
    const splash = await c.js(() => document.querySelector('#loadCn')?.textContent);
    assert(splash === 'Sharotank Online', 'splash says ' + splash);
    await c.page.waitForSelector('#bGo', { state: 'visible', timeout: 60000 });
    const help = await c.js(() => document.querySelector('#help h1, .help h1, h1')?.textContent || '');
    assert(/Шаротанк\s*Онлайн/.test(help), 'controls screen title: ' + help);
    await c.page.click('#bGo'); await c.wait(1500);
    const st = await c.js(() => ({ hp: __dbg.TK.hp, loc: __dbg.LOC_ID || null, fps: __dbg.renderer ? 1 : 0 }));
    assert(st.hp > 0, 'tank has no hp');
  } },
  { name: 'phone layout: real viewport width, readable HUD', async run(ctx) {
    const c = await client({ name: 'phone', w: 412, h: 860, touch: true }); ctx.clients.push(c);
    const m = await c.js(() => ({ cw: document.documentElement.clientWidth, fs: parseFloat(getComputedStyle(document.querySelector('#obj') || document.body).fontSize) }));
    assert(m.cw <= 420, `layout width ${m.cw}px on a 412px phone — viewport meta lost?`);
    assert(m.fs >= 10, `HUD font ${m.fs}px`);
    await c.shot('hud');
  } },
  { name: 'landscape phone: boss bar does not cover the objective', async run(ctx) {
    const c = await client({ name: 'land', w: 860, h: 412, touch: true }); ctx.clients.push(c);
    await c.js(() => { const D = __dbg; D.MS.i = 9; D.MS.active = true; D.MS.prog = 0; D.goLocation('junk', 'N'); });
    await c.until(() => !document.querySelector('#bossBar')?.hidden, null, { timeout: 30000 });
    const r = await c.js(() => { const a = document.querySelector('#bossBar').getBoundingClientRect(), b = document.querySelector('#obj').getBoundingClientRect(); return { a: [a.left, a.top, a.right, a.bottom], b: [b.left, b.top, b.right, b.bottom] }; });
    const ov = !(r.a[0] >= r.b[2] || r.a[2] <= r.b[0] || r.a[1] >= r.b[3] || r.a[3] <= r.b[1]);
    await c.shot('bossbar');
    assert(!ov, 'boss bar overlaps objective: ' + JSON.stringify(r));
  } }
];
