/* «Онлайн рейтинг» (v30.0): пилот с PIN, вход с другого устройства, рейтинг по очкам, друзья (☆), карточка с 3D-машиной,
   врагами по видам и медалями, лом ползунком, сообщения → всплывающие уведомления, переписка.
   Сервер — мок Apps Script (tests/net/sheets-mock.mjs) с той же логикой, что server/sheets/core.js. */
import { client } from '../harness.mjs';
import { startSheets, loadCore, memDb, sha } from '../net/sheets-mock.mjs';
const assert = (c, m) => { if (!c) throw new Error(m); };

async function auth(c, kind, nick, pin) {
  await c.js(() => document.querySelector('#bDrv2').click());
  await c.until(() => !document.querySelector('#drvReg').hidden, null, { timeout: 5000 });
  await c.page.fill('#drvNick', nick); await c.page.fill('#drvPin', pin);
  await c.js(k => document.querySelector(k === 'reg' ? '#drvRegGo' : '#drvLogGo').click(), kind);
  return c.until(() => __dbg.DRV.nick || (document.querySelector('#drvMsg').classList.contains('err') && 'ERR:' + document.querySelector('#drvMsg').textContent), null, { timeout: 8000 });
}
const win = (c, boss) => c.js(b => { const D = __dbg, e = { type: b }; D.DRV.fight = { e, t: 120, hp: D.TK.hp, lost: 50, max: 100 }; D.drvBossWin(e); }, boss);

export const tests = [
  { name: 'online core: pin lock, friends only, limits, 7-day archive', timeout: 20, async run() {
    const c = loadCore(), db = memDb(c.SH_COLS); let now = 1e12; const H = p => c.shHandle(db, p, now, sha);
    assert(H({ a: 'reg', nick: 'Аня', pin: '1234' }).ok && H({ a: 'reg', nick: 'Боря', pin: '0000' }).ok, 'reg');
    assert(H({ a: 'reg', nick: 'X', pin: '12' }).err === 'nick' && H({ a: 'reg', nick: 'Вова', pin: '12a4' }).err === 'pin', 'validation');
    for (let i = 0; i < 5; i++) H({ a: 'login', nick: 'Аня', pin: '9999' });
    assert(H({ a: 'login', nick: 'Аня', pin: '1234' }).err === 'locked', 'no lock after 5 bad pins'); now += 11 * 60000;
    assert(H({ a: 'login', nick: 'аня', pin: '1234' }).ok, 'login after lock');
    assert(H({ a: 'send', nick: 'Аня', pin: '1234', to: 'Боря', kind: 'msg', text: 'hi' }).err === 'not_friend', 'non-friend message accepted');
    H({ a: 'friend', nick: 'Аня', pin: '1234', who: 'Боря', on: '1' });
    assert(H({ a: 'send', nick: 'Аня', pin: '1234', to: 'Боря', kind: 'msg', text: 'x'.repeat(51) }).err === 'bad', '51 chars accepted');
    assert(H({ a: 'send', nick: 'Аня', pin: '1234', to: 'Боря', kind: 'scrap', amount: 5 }).err === 'bad', '5 scrap accepted');
    assert(H({ a: 'send', nick: 'Аня', pin: '1234', to: 'Боря', kind: 'rep', amount: 1 }).err === 'bad', 'non-scrap parcel accepted');
    assert(H({ a: 'send', nick: 'Аня', pin: '1234', to: 'Боря', kind: 'msg', text: 'привет' }).ok, 'message');
    const s = H({ a: 'sync', nick: 'Боря', pin: '0000', kills: 7, med: '["first"]' }); assert(s.inbox.length === 1 && s.me.score === 57, 'sync/score: ' + JSON.stringify(s));
    now += 8 * 864e5; H({ a: 'sync', nick: 'Боря', pin: '0000' }); assert(db.T.Messages.length === 0, 'old messages not removed');
  } },
  { name: 'online core: swear filter + 24 h mute, 10 messages a minute, cheap poll', timeout: 20, async run() {
    const c = loadCore(), db = memDb(c.SH_COLS); let now = 2e12; const H = p => c.shHandle(db, p, now, sha);
    H({ a: 'reg', nick: 'Аня', pin: '1234' }); H({ a: 'reg', nick: 'Боря', pin: '0000' }); H({ a: 'friend', nick: 'Аня', pin: '1234', who: 'Боря', on: '1' });
    // poll without new mail never reads the sheets
    let reads = 0; const rows = db.rows; db.rows = t => { reads++; return rows(t); };
    assert(H({ a: 'poll', nick: 'Боря', pin: '0000' }).inbox.length === 0 && reads === 0, 'empty poll touched the sheets: ' + reads); db.rows = rows;
    for (let i = 0; i < 10; i++) assert(H({ a: 'send', nick: 'Аня', pin: '1234', to: 'Боря', kind: 'msg', text: 'го ' + i }).ok, 'msg ' + i);
    assert(H({ a: 'send', nick: 'Аня', pin: '1234', to: 'Боря', kind: 'msg', text: 'ещё' }).err === 'spam', '11th message in a minute accepted');
    assert(H({ a: 'poll', nick: 'Боря', pin: '0000' }).inbox.length === 10, 'poll after mail');
    assert(H({ a: 'poll', nick: 'Боря', pin: '0000' }).inbox.length === 0, 'flag not cleared');
    now += 61000;
    const r = H({ a: 'send', nick: 'Аня', pin: '1234', to: 'Боря', kind: 'msg', text: 'ну ты и сука, xyй' });
    assert(r.ok && r.muted > now && !/сука|xyй/.test(r.text) && /^ну ты и /.test(r.text), 'swear not masked / no mute: ' + JSON.stringify(r));
    const got = H({ a: 'poll', nick: 'Боря', pin: '0000' }).inbox[0]; assert(got && got.text === r.text, 'recipient got the raw text: ' + JSON.stringify(got));
    const m = H({ a: 'send', nick: 'Аня', pin: '1234', to: 'Боря', kind: 'msg', text: 'привет' }); assert(m.err === 'muted' && m.until > now, 'mute not applied');
    assert(H({ a: 'send', nick: 'Аня', pin: '1234', to: 'Боря', kind: 'scrap', amount: 50 }).ok, 'scrap must still work while muted');
    now += 24 * 3600000 + 1000; assert(H({ a: 'send', nick: 'Аня', pin: '1234', to: 'Боря', kind: 'msg', text: 'привет' }).ok, 'mute did not expire');
    for (const w of ['страхую машину', 'употреблять', 'мандарин', 'небанальный', 'cocktail', 'assassin', 'хлебать', 'утварь']) assert(!c.shClean(w).bad, 'false positive: ' + w);
    for (const w of ['х у й', 'п.и.з.д.а', 'blyat', 'nahuy', 'заебал', 'fuuuck', 'sh1t', 'долбоёб']) assert(c.shClean(w).bad, 'missed: ' + w);
  } },
  { name: 'online rating: not configured → clear message', timeout: 60, async run(ctx) {
    const c = await client({ name: 'drv-off' }); ctx.clients.push(c);
    await c.js(() => document.querySelector('#bDrv2').click());
    const m = await c.js(() => document.querySelector('#drvMsg').textContent);
    assert(/не подключён/.test(m), 'no-server message: ' + m);
  } },
  { name: 'online rating: pilots, friends, card, scrap, messages, second device', timeout: 200, async run(ctx) {
    const sh = await startSheets(); ctx.onDone = () => sh.close();
    try {
      const a = await client({ name: 'anya', net: { sheets: sh.url } }), b = await client({ name: 'borya', net: { sheets: sh.url } }); ctx.clients.push(a, b);
      await a.js(() => { document.querySelector('[data-av="5"]') || 0; });
      assert(await auth(a, 'reg', 'Аня', '1234') === 'Аня', 'Аня not registered');
      const dup = await auth(b, 'reg', 'аня', '1111'); assert(String(dup).startsWith('ERR:') && /занят/.test(dup), 'duplicate nick accepted: ' + dup);
      assert(await auth(b, 'reg', 'Боря', '0000') === 'Боря', 'Боря not registered');

      // Аня fights: kills by type + a boss → medals, synced to the server
      await a.js(() => { const D = __dbg; for (let i = 0; i < 3; i++) D.drvKill('jian', '', null); D.drvKill('bull', 'ram', null); D.drvKill('dseg', '', null); D.ST.scrap = 1000; });
      await win(a, 'krot');
      await a.js(() => { __dbg.DRV.syncT = 0; });
      for (let i = 0; i < 40 && !/krot/.test(sh.db.T.Pilots.find(p => p.nick === 'Аня').med); i++) await a.wait(200);
      const pa = sh.db.T.Pilots.find(p => p.nick === 'Аня');
      assert(pa.kills === 4 && /"jian":3/.test(pa.kbt) && /krot/.test(pa.med) && /first/.test(pa.med), 'Аня on server: ' + JSON.stringify(pa));

      // Боря: rating shows Аня first, star → friends tab
      await b.js(() => { __dbg.DRV.topT = 0; });
      await b.until(() => (__dbg.DRV.cache.top || []).length === 2, null, { timeout: 8000 });
      await b.js(() => __dbg.drvTab('top'));
      const rows = await b.js(() => [...document.querySelectorAll('#drvBody .drvL li .nm')].map(n => n.firstChild.textContent));
      assert(rows[0] === 'Аня' && rows[1] === 'Боря', 'rating order: ' + rows);
      await b.js(() => document.querySelector('[data-star="Аня"]').click());
      await b.until(() => __dbg.DRV.friends.includes('Аня') && document.querySelector('[data-star="Аня"].on'), null, { timeout: 8000 });
      await b.js(() => __dbg.drvTab('fr'));
      assert(await b.js(() => document.querySelectorAll('#drvBody .drvL li').length) === 1, 'friends tab');

      // Аня's card: 3D machine, kills by type, deaths, medals with descriptions
      await b.js(() => document.querySelector('#drvBody li[data-who="Аня"]').click());
      const card = await b.until(() => { const t = document.querySelector('#drvCB').textContent; return /Кузнечик/.test(t) && document.querySelector('[data-gift]') ? t : null; }, null, { timeout: 8000 });
      assert(card && /Бизон/.test(card) && !/лома у/.test(card), 'card content: ' + card);
      const cv = await b.js(() => ({ hid: document.querySelector('#drvTk').hidden, tk: document.querySelector('#drvTkN').textContent, med: document.querySelectorAll('#drvCB .dmed button').length }));
      assert(!cv.hid && /Шаротанк/.test(cv.tk) && cv.med === 2, 'card tank/medals: ' + JSON.stringify(cv));
      await b.js(() => document.querySelector('#drvCB [data-med="krot"]').click());
      assert(/Кротолов/.test(await b.js(() => document.querySelector('.dmedTx').textContent)), 'medal description');

      // scrap by number field, then a message
      const b0 = await b.js(() => __dbg.ST.scrap), a0 = await a.js(() => __dbg.ST.scrap);
      await b.page.fill('#drvAmtN', '150'); await b.js(() => document.querySelector('[data-gift]').click());
      await b.until(() => /Отправлено/.test(document.querySelector('#drvMsg').textContent), null, { timeout: 8000 });
      assert(await b.js(() => __dbg.ST.scrap) === b0 - 150, 'sender scrap not deducted');
      await b.page.fill('#drvTxt', 'Аня, держи лом!'); await b.js(() => document.querySelector('[data-say]').click());
      await b.until(() => /ушло/.test(document.querySelector('#drvMsg').textContent), null, { timeout: 8000 });
      assert(await b.js(() => document.querySelectorAll('.dlog li').length) === 2, 'archive after sending');
      await a.js(() => { document.querySelector('#drvClose').click(); __dbg.DRV.pollT = 0; });
      assert(await a.until(s => __dbg.ST.scrap === s + 150, a0, { timeout: 8000 }), 'scrap not received');
      const note = await a.until(() => { const t = [...document.querySelectorAll('.dnote')].map(n => n.textContent).join('|'); return /ВХОДЯЩЕЕ СООБЩЕНИЕ ОТ Боря/.test(t) && /держи лом/.test(t) && /ПОСЫЛКА ОТ Боря/.test(t) ? t : null; }, null, { timeout: 6000 });
      assert(note, 'notes not shown');
      await a.shot('drv-notes');
      // tap the message → reply box, a solo game pauses; reply arrives to Боря
      await a.js(() => { const n = document.querySelector('.dnote.rep'), r = n.getBoundingClientRect(), o = { bubbles: true, clientX: r.x + 20, clientY: r.y + 10, pointerId: 7 };
        n.dispatchEvent(new PointerEvent('pointerdown', o)); n.dispatchEvent(new PointerEvent('pointerup', o)); });
      const rp = await a.js(() => ({ open: !document.querySelector('#drvReply').hidden, to: document.querySelector('#drvRepTo').textContent, paused: __dbg.PAUSED }));
      assert(rp.open && rp.to === 'Боря' && rp.paused, 'reply box: ' + JSON.stringify(rp));
      const t0 = await a.js(() => __dbg.TK.x); await a.wait(500);
      await a.page.fill('#drvRepTx', 'Спасибо!'); await a.js(() => document.querySelector('#drvRepGo').click());
      assert(await a.until(() => document.querySelector('#drvReply').hidden && !__dbg.PAUSED, null, { timeout: 8000 }), 'reply not sent / still paused: ' + await a.js(() => document.querySelector('#drvRepMsg').textContent));
      await b.js(() => { __dbg.DRV.pollT = 0; });
      assert(await b.until(() => [...document.querySelectorAll('.dnote')].some(n => /Спасибо/.test(n.textContent)), null, { timeout: 8000 }), 'reply not delivered');
      // swipe away
      await b.js(() => { const n = document.querySelector('.dnote'), r = n.getBoundingClientRect(), o = { bubbles: true, clientX: r.x + 20, clientY: r.y + 10, pointerId: 3 };
        n.dispatchEvent(new PointerEvent('pointerdown', o)); n.dispatchEvent(new PointerEvent('pointermove', { ...o, clientY: o.clientY - 90 })); n.dispatchEvent(new PointerEvent('pointerup', { ...o, clientY: o.clientY - 90 }));
        window.__sw = n.classList.contains('swipe'); });
      assert(await b.js(() => window.__sw), 'swipe effect not started');
      void t0;

      // second device: log in as Аня with the PIN, counters and medals come back
      const c = await client({ name: 'anya2', net: { sheets: sh.url } }); ctx.clients.push(c);
      const bad = await auth(c, 'login', 'Аня', '9999'); assert(String(bad).startsWith('ERR:'), 'wrong PIN accepted');
      await c.page.fill('#drvPin', '1234'); await c.js(() => document.querySelector('#drvLogGo').click());
      const back = await c.until(() => __dbg.DRV.nick === 'Аня' && __dbg.DRV.kills >= 4 && __dbg.DRV.medals.krot, null, { timeout: 8000 });
      assert(back, 'login did not restore Аня: ' + JSON.stringify(await c.js(() => [__dbg.DRV.nick, __dbg.DRV.kills, Object.keys(__dbg.DRV.medals)])));
      await c.js(() => document.querySelector('#drvMe').click());
      assert(await c.js(() => document.querySelectorAll('#drvCB .dmed button').length) === (await c.js(() => __dbg.MEDALS.length)), 'own card must list all medals');
      assert(await c.js(() => document.querySelectorAll('#drvCB .dav').length) === 9, '9 avatars');
      await c.js(() => document.querySelector('#drvCB [data-av="6"]').click()); await c.js(() => { __dbg.DRV.syncT = 0; });
      for (let i = 0; i < 40 && sh.db.T.Pilots.find(p => p.nick === 'Аня').av !== 6; i++) await c.wait(200); // dirty clears when the request leaves
      assert(sh.db.T.Pilots.find(p => p.nick === 'Аня').av === 6, 'avatar not synced');
    } finally { await sh.close(); }
  } }
];
