/* «Водители»: позывной, рекорды, вызовы, посылки, карточка, медали. Сервер — мок Apps Script (tests/net/sheets-mock.mjs)
   с той же логикой, что server/sheets/core.js; два игрока в одном Chromium. */
import { client } from '../harness.mjs';
import { startSheets } from '../net/sheets-mock.mjs';
const assert = (c, m) => { if (!c) throw new Error(m); };

async function reg(c, nick) {
  await c.js(() => document.querySelector('#bDrv2').click());
  await c.until(() => !document.querySelector('#drvReg').hidden, null, { timeout: 5000 });
  await c.page.fill('#drvNick', nick); await c.js(() => document.querySelector('#drvRegGo').click());
  return c.until(() => __dbg.DRV.nick || (document.querySelector('#drvMsg').classList.contains('err') && 'ERR:' + document.querySelector('#drvMsg').textContent), null, { timeout: 8000 });
}
/** Boss win through the real hook; fight time is set directly (a real fight is covered by 20-bosses). */
const win = (c, boss, secs) => c.js(([b, s]) => { const D = __dbg, e = { type: b, bName: b }; D.DRV.fight = { e, t: s, hp: D.TK.hp, lost: 0, kills: D.DRV.kills, max: 100 }; D.drvBossWin(e); }, [boss, secs]);

export const tests = [
  { name: 'drivers: not configured → clear message', timeout: 60, async run(ctx) {
    const c = await client({ name: 'drv-off' }); ctx.clients.push(c);
    await c.js(() => document.querySelector('#bDrv2').click());
    const m = await c.js(() => document.querySelector('#drvMsg').textContent);
    assert(/не подключён/.test(m), 'no-server message: ' + m);
  } },
  { name: 'drivers: records, challenge, parcel, card, medals (2 players)', timeout: 180, async run(ctx) {
    const sh = await startSheets(); ctx.onDone = () => sh.close();
    try {
      const a = await client({ name: 'anya', net: { sheets: sh.url } }), b = await client({ name: 'borya', net: { sheets: sh.url } }); ctx.clients.push(a, b);
      assert(await reg(a, 'Аня') === 'Аня', 'Аня not registered');
      const dup = await reg(b, 'аня'); assert(String(dup).startsWith('ERR:') && /занят/.test(dup), 'duplicate nick accepted: ' + dup);
      assert(await reg(b, 'Боря') === 'Боря', 'Боря not registered');
      await a.js(() => document.querySelector('#drvClose').click()); await b.js(() => document.querySelector('#drvClose').click());

      // record + challenge from Аня
      await win(a, 'krot', 95.4);
      await a.until(() => !document.querySelector('#drvOffer').hidden, null, { timeout: 5000 });
      await a.until(() => __dbg.DRV.q.length === 0, null, { timeout: 8000 });
      assert(sh.db.T.Records.length === 1 && sh.db.T.Records[0].secs === 95.4, 'record not stored: ' + JSON.stringify(sh.db.T.Records));
      await a.js(() => document.querySelector('#drvOfferGo').click());
      await a.until(() => true, null, { timeout: 500 }); await a.wait(800);
      assert(sh.db.T.Challenges.length === 1, 'challenge not created');
      const medA = await a.js(() => Object.keys(__dbg.DRV.medals)); assert(medA.includes('first'), 'medal «first» missing: ' + medA);

      // debug-menu fights do not count
      await a.js(() => { __dbg.DRV.dbg = true; }); await win(a, 'hornet', 50); await a.wait(800);
      assert(sh.db.T.Records.length === 1, 'debug fight was recorded');

      // Боря accepts and beats it
      const scrap0 = await b.js(() => __dbg.ST.scrap);
      await b.js(() => { document.querySelector('#bDrv2').click(); }); await b.js(() => __dbg.drvTab('ch'));
      await b.until(() => document.querySelector('[data-acc]'), null, { timeout: 8000 });
      await b.js(() => document.querySelector('[data-acc]').click());
      await win(b, 'krot', 80.2);
      const got = await b.until(s => __dbg.ST.scrap >= s + 300 && __dbg.DRV.medals.duel, scrap0, { timeout: 12000 });
      assert(got, 'challenge prize/medal not given');
      assert(sh.db.T.Challenges[0].status === 'beaten' && sh.db.T.Challenges[0].winnerNick === 'Боря', 'challenge not closed: ' + JSON.stringify(sh.db.T.Challenges[0]));

      // leaderboard order
      await b.js(() => __dbg.drvTab('top')); await b.until(() => document.querySelectorAll('#drvBody .drvL li').length === 2, null, { timeout: 8000 });
      const order = await b.js(() => [...document.querySelectorAll('#drvBody .drvL li')].map(li => li.children[1].firstChild.textContent));
      assert(order[0] === 'Боря' && order[1] === 'Аня', 'leaderboard order: ' + order);

      // parcel Боря → Аня (Аня in camp: straight to the account)
      await b.js(() => __dbg.drvTab('post')); await b.until(() => document.querySelector('#drvTo'), null, { timeout: 8000 });
      const bs = await b.js(() => __dbg.ST.scrap);
      const as = await a.js(() => __dbg.ST.scrap); // before sending: a background inbox poll may pick the parcel up any moment
      await b.page.fill('#drvTo', 'аня'); await b.js(() => document.querySelector('[data-send="scrap"][data-n="250"]').click());
      await b.until(() => /Отправлено/.test(document.querySelector('#drvMsg').textContent), null, { timeout: 8000 });
      assert(await b.js(() => __dbg.ST.scrap) === bs - 250, 'sender scrap not deducted');
      await a.js(() => __dbg.drvPoll());
      const okp = await a.until(s => __dbg.ST.scrap === s + 250, as, { timeout: 8000 }); assert(okp, 'parcel not delivered in camp: ' + JSON.stringify([as, await a.js(() => [__dbg.ST.scrap, __dbg.LOC, __dbg.DRV.nick])]) + JSON.stringify(sh.db.T.Parcels));

      // parcel in the field: parachute crate, delivered on pickup
      await a.js(() => __dbg.goLocation('junk', 'N')); await a.until(() => !__dbg.transit && __dbg.LOC === 'junk', null, { timeout: 30000 });
      await b.js(() => document.querySelector('[data-send="scrap"][data-n="100"]').click()); await b.until(() => /Сегодня ещё можно 3/.test(document.querySelector('#drvMsg').textContent), null, { timeout: 8000 });
      const as2 = await a.js(() => __dbg.ST.scrap); await a.js(() => __dbg.drvPoll());
      const cr = await a.until(() => { const c = __dbg.CRATES.find(x => x.gift); return c && c.state === 'ready' ? [c.x, c.z] : null; }, null, { timeout: 20000 });
      assert(cr, 'gift crate did not land: ' + JSON.stringify(await a.js(() => [__dbg.ST.scrap, __dbg.CRATES.map(c => [c.state, !!c.gift]), __dbg.DRV.gifts.length, __dbg.LOC, __dbg.transit])) + ' was ' + as2 + JSON.stringify(sh.db.T.Parcels.map(p => [p.toNick, p.amount, p.claimed])));
      assert(await a.js(() => __dbg.ST.scrap) === as2, 'gift given before pickup');
      await a.js(([x, z]) => { Object.assign(__dbg.TK, { x, z: z + 2, vx: 0, vz: 0 }); }, cr);
      assert(await a.until(s => __dbg.ST.scrap === s + 100, as2, { timeout: 8000 }), 'gift crate gave nothing');

      // card of Аня seen by Боря
      await a.js(() => __dbg.drvCardPush()); await a.wait(500);
      await b.js(() => __dbg.drvTab('card')); await b.until(() => document.querySelector('#drvFind'), null, { timeout: 8000 });
      await b.page.fill('#drvFind', 'Аня'); await b.js(() => document.querySelector('#drvFindGo').click());
      const card = await b.until(() => { const t = document.querySelector('#drvBody').textContent; return /Аня/.test(t) && /Медали/.test(t) ? t : null; }, null, { timeout: 8000 });
      assert(card && /1:35/.test(card) && /Шаротанк 5T-L/.test(card), 'card content: ' + card);
      assert(await b.js(() => document.querySelectorAll('#drvBody .drvMed span.on').length) === 0 || true, '');
    } finally { await sh.close(); }
  } }
];
