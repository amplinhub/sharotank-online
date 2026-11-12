/* Онлайн, этап 1: транспорт и лобби. Два клиента в одном Chromium, сигналинг — локальный (tests/net/server.mjs).
   Игровых данных между клиентами пока нет (снимки и ввод — этап 3), проверяем соединение по коду,
   готовность, старт и обрыв. */
import { client } from '../harness.mjs';
import { startSignaling, startDeafServer } from '../net/server.mjs';
const assert = (c, m) => { if (!c) throw new Error(m); };
const vis = (c, sel) => c.js(s => { const e = document.querySelector(s); return !!e && !e.hidden && getComputedStyle(e).display !== 'none'; }, sel);
const txt = (c, sel) => c.js(s => document.querySelector(s)?.textContent || '', sel);

let joinMs = 0; // от нажатия «Войти» до экрана комнаты у гостя
async function pair(ctx, sig) {
  const host = await client({ name: 'host', start: false, net: sig.cfg }); ctx.clients.push(host);
  const guest = await client({ name: 'guest', start: false, net: sig.cfg }); ctx.clients.push(guest);
  for (const c of [host, guest]) await c.page.waitForSelector('#bOnline', { state: 'visible', timeout: 60000 });
  await host.page.click('#bOnline'); await host.page.click('#lbCreate');
  await host.page.waitForSelector('#lbRoom:not([hidden])', { timeout: 15000 });
  const code = (await txt(host, '#lbCodeBig')).trim();
  assert(/^[A-HJ-NP-Z2-9]{5}$/.test(code), 'room code looks wrong: ' + code);
  await guest.page.click('#bOnline'); await guest.page.fill('#lbCode', code.toLowerCase());
  const t0 = Date.now(); await guest.page.click('#lbJoin');
  await guest.page.waitForSelector('#lbRoom:not([hidden])', { timeout: 15000 }); joinMs = Date.now() - t0;
  return { host, guest, code };
}

export const tests = [
  { name: 'guest joins by code, both see each other', async run(ctx) {
    const sig = await startSignaling(); try {
      const { host, guest } = await pair(ctx, sig);
      const ok = await host.until(() => document.querySelector('#lbPeer').textContent.includes('не готов'), null, { timeout: 8000 });
      assert(ok, 'host never saw the guest: ' + await txt(host, '#lbPeer'));
      assert(await txt(guest, '#lbPeer') === 'не готов', 'guest sees host as: ' + await txt(guest, '#lbPeer'));
      // два игры с программным WebGL грузят процессор: в этой среде ≈3,5 с; на телефонах по сети ожидаем быстрее
      assert(joinMs < 8000, 'join took ' + joinMs + ' ms');
      const dt = await host.js(() => window.__lb.t.open);
      assert(dt === true, 'transport not open');
    } finally { await sig.close(); }
  } },
  { name: 'ready → start puts both players into the arena', async run(ctx) {
    const sig = await startSignaling(); try {
      const { host, guest } = await pair(ctx, sig);
      await guest.page.waitForSelector('#lbRoom:not([hidden])', { timeout: 15000 });
      await host.until(() => !document.querySelector('#lbReady').disabled, null, { timeout: 8000 });
      assert(await host.js(() => document.querySelector('#lbStart').disabled), 'start must be locked until both ready');
      await guest.page.click('#lbReady');
      assert(await host.until(() => document.querySelector('#lbPeer').textContent === 'готов', null, { timeout: 5000 }), 'host did not see guest ready');
      assert(await host.js(() => document.querySelector('#lbStart').disabled), 'start unlocked with host not ready');
      await host.page.click('#lbReady');
      assert(await guest.until(() => document.querySelector('#lbPeer').textContent === 'готов', null, { timeout: 5000 }), 'guest did not see host ready');
      await host.until(() => !document.querySelector('#lbStart').disabled, null, { timeout: 3000 });
      await host.page.click('#lbStart');
      for (const c of [host, guest]) {
        const r = await c.until(() => window.__lb.inGame && !__dbg.transit && __dbg.LOC_ID === 'south', null, { timeout: 60000 });
        assert(r, c.name + ' did not reach the village');
        assert(await vis(c, '#lobby') === false, c.name + ': lobby still on screen');
        assert(await c.js(() => !document.querySelector('#help').hidden) === false, c.name + ': menu still on screen');
      }
    } finally { await sig.close(); }
  } },
  { name: 'host leaves → guest sees «хост отключился» and returns to the menu', slow: true, timeout: 120, async run(ctx) {
    const sig = await startSignaling(); try {
      const { host, guest } = await pair(ctx, sig);
      await guest.page.waitForSelector('#lbRoom:not([hidden])', { timeout: 15000 });
      await host.until(() => !document.querySelector('#lbReady').disabled, null, { timeout: 8000 });
      await guest.page.click('#lbReady'); await host.page.click('#lbReady');
      await host.until(() => !document.querySelector('#lbStart').disabled, null, { timeout: 5000 });
      await host.page.click('#lbStart');
      assert(await guest.until(() => window.__lb.inGame && !__dbg.transit && __dbg.LOC_ID === 'south', null, { timeout: 60000 }), 'guest not in game');
      await host.close(); // как будто хост закрыл вкладку; ctx.clients закроет повторно без ошибки
      const msg = await guest.until(() => { const e = document.querySelector('#lbMsg'); return !e.hidden && !document.querySelector('#lobby').hidden ? document.querySelector('#lbMsgTx').textContent : ''; }, null, { timeout: 30000 });
      assert(/Хост отключился/.test(msg), 'guest message: ' + msg);
      await guest.page.click('#lbOk');
      assert(await guest.until(() => !document.querySelector('#help').hidden && document.querySelector('#lobby').hidden, null, { timeout: 5000 }), 'guest not back in the menu');
      assert(await guest.until(() => !__dbg.transit && __dbg.LOC_ID === 'camp', null, { timeout: 60000 }), 'guest did not return to camp');
    } finally { await sig.close(); }
  } },
  { name: 'guest leaves the lobby → host stays in the room and can wait again', async run(ctx) {
    const sig = await startSignaling(); try {
      const { host, guest } = await pair(ctx, sig);
      await guest.page.waitForSelector('#lbRoom:not([hidden])', { timeout: 15000 });
      await host.until(() => document.querySelector('#lbPeer').textContent.includes('готов'), null, { timeout: 8000 });
      await guest.page.click('#lbLeave');
      assert(await host.until(() => document.querySelector('#lbPeer').textContent === 'ждём…', null, { timeout: 15000 }), 'host did not notice the guest leaving: ' + await txt(host, '#lbPeer'));
      assert(await vis(host, '#lbRoom'), 'host room closed');
    } finally { await sig.close(); }
  } },
  { name: 'errors: wrong code, malformed code, signaling server down', async run(ctx) {
    const sig = await startSignaling();
    const g = await client({ name: 'lonely', start: false, net: sig.cfg }); ctx.clients.push(g);
    try {
      await g.page.waitForSelector('#bOnline', { state: 'visible', timeout: 60000 });
      await g.page.click('#bOnline');
      await g.page.fill('#lbCode', 'AB'); await g.page.click('#lbJoin');
      assert(/5 символов/.test(await txt(g, '#lbMsgTx')), 'malformed code message: ' + await txt(g, '#lbMsgTx'));
      await g.page.click('#lbOk');
      await g.page.fill('#lbCode', 'ZZZZZ'); await g.page.click('#lbJoin');
      assert(await g.until(() => /Комнаты с таким кодом нет/.test(document.querySelector('#lbMsgTx').textContent), null, { timeout: 15000 }), 'no-room message: ' + await txt(g, '#lbMsgTx'));
      await g.page.click('#lbOk');
      assert(await vis(g, '#lbMenu'), 'did not return to the join screen');
    } finally { await sig.close(); }
    await g.page.click('#lbCreate'); // сервер уже остановлен
    assert(await g.until(() => /Сервер комнат недоступен/.test(document.querySelector('#lbMsgTx').textContent), null, { timeout: 20000 }), 'server-down message: ' + await txt(g, '#lbMsgTx'));
    g.errors.length = 0; // браузер сам пишет в консоль о сорванном WebSocket — это ожидаемо
  } },
  { name: 'errors: signaling hangs → clear message after ~10 s', slow: true, async run(ctx) {
    const deaf = await startDeafServer();
    const g = await client({ name: 'deaf', start: false, net: deaf.cfg }); ctx.clients.push(g);
    try {
      await g.page.waitForSelector('#bOnline', { state: 'visible', timeout: 60000 });
      await g.page.click('#bOnline'); await g.page.fill('#lbCode', 'ABCDE'); await g.page.click('#lbJoin');
      const t0 = Date.now();
      assert(await g.until(() => !document.querySelector('#lbMsg').hidden, null, { timeout: 25000 }), 'no error after hang');
      const dt = Date.now() - t0;
      assert(dt > 8000 && dt < 16000, 'timeout took ' + dt + ' ms');
      assert(/Сервер комнат недоступен|Не удалось соединиться/.test(await txt(g, '#lbMsgTx')), 'message: ' + await txt(g, '#lbMsgTx'));
    } finally { deaf.close(); }
    g.errors.length = 0;
  } }
];
