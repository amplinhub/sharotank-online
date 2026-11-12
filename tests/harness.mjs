/* Browser harness: boots the single-file build in headless Chromium (software WebGL)
   and exposes small helpers. Every suite gets a fresh page from `client()`.
   Multiplayer later: open two clients with client({ name:'host' }) / client({ name:'guest' })
   and drive them in parallel — the API is already per-client. */
import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';

export const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
export const PAGE = 'file://' + path.join(ROOT, 'dist-single', 'index.html');
export const OUT = path.join(ROOT, 'test-results');
fs.mkdirSync(OUT, { recursive: true });

let browser = null;
export async function launch() {
  browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-features=WebRtcHideLocalIpsWithMdns'] });
  return browser;
}
export async function close() { if (browser) await browser.close(); browser = null; }

/** Open a game client. Returns { page, errors, js(), wait(), shot(), name }. */
export async function client({ name = 'p1', w = 900, h = 560, touch = false, quality = 'low', start = true, net = null } = {}) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: touch, isMobile: touch });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error' && !/favicon|net::ERR/.test(m.text())) errors.push('console: ' + m.text()); });
  await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  await page.addInitScript(() => { window.__DT_MAX = 1 / 15; }); // software WebGL is slow: let the sim take bigger steps
  await page.addInitScript(q => { try { localStorage.setItem('sharotank_gfx_v1', JSON.stringify({ mode: q, q, locked: true })); } catch (e) {} }, quality);
  if (net) await page.addInitScript(cfg => { window.SHT_NET_CFG = cfg; }, net); // адрес сигнального сервера (тесты онлайна)
  await page.goto(PAGE);
  await page.waitForFunction(() => window.__dbg && window.__dbg.TK, null, { timeout: 60000 });
  const c = {
    name, page, errors,
    js: (fn, arg) => page.evaluate(fn, arg),
    wait: ms => page.waitForTimeout(ms),
    shot: file => page.screenshot({ path: path.join(OUT, `${name}-${file}.png`) }),
    async until(fn, arg, { timeout = 20000, every = 250 } = {}) {
      const t0 = Date.now();
      for (;;) { const v = await page.evaluate(fn, arg); if (v) return v; if (Date.now() - t0 > timeout) return v; await page.waitForTimeout(every); }
    },
    close: () => ctx.close()
  };
  if (start) { await page.waitForSelector('#bGo', { state: 'visible', timeout: 60000 }); await page.click('#bGo'); await c.wait(800); }
  return c;
}

/** Go to a mission's boss arena; returns the boss summary once it has spawned. */
export async function toBoss(c, { loc, side, mission }) {
  await c.js(([L, S, I]) => { const D = __dbg; D.MS.i = I; D.MS.active = true; D.MS.prog = 0; D.goLocation(L, S); }, [loc, side, mission]);
  return c.until(() => { const b = __dbg.ENEMIES.find(e => e.boss); return b && !__dbg.transit ? { type: b.type, hp: b.hp, x: b.x, z: b.z } : null; }, null, { timeout: 30000 });
}

/** Fire one real cannon shell from just outside the boss's hit sphere straight at its centre. */
export async function shellAt(c, filter = 'boss') {
  return c.js(f => {
    const D = __dbg, e = D.ENEMIES.find(x => f === 'boss' ? x.boss : x.type === f); if (!e) return false;
    const a = Math.random() * Math.PI * 2, R = (e.shOn ? e.shieldR : e.hr) + 6, cy = e.y + e.hy;
    const x = e.x + Math.cos(a) * R, z = e.z + Math.sin(a) * R, sp = 60;
    D.proj.push({ x, y: cy, z, vx: -Math.cos(a) * sp, vy: 0, vz: -Math.sin(a) * sp, w: { ...D.WEAP[1], g: 0 }, life: 1, mesh: new THREE.Mesh() });
    return true;
  }, filter);
}
