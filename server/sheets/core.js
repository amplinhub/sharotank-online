/* Шаротанк Онлайн — «Водители»: рекорды, вызовы, посылки, карточки.
   Чистая логика без Google API: работает и в Apps Script (Code.gs собирается из этого файла + gas.js),
   и в тестовом мок-сервере (tests/net/sheets-mock.mjs). Хранилище — таблицы из строк-объектов:
     db.rows(t)          → массив объектов (поле _r — номер строки в листе)
     db.append(t, obj)   → добавить строку
     db.update(t, obj)   → переписать строку obj._r
   Все ответы — {ok:true,...} или {ok:false,err:'код'}. */
var SH_VER = 1;
var SH_COLS = {
  Players:    ['id', 'nick', 'keyHash', 'created', 'lastSeen', 'rank', 'missions', 'card'],
  Records:    ['time', 'id', 'nick', 'boss', 'tank', 'secs', 'kills', 'rank', 'ver'],
  Challenges: ['cid', 'time', 'fromId', 'fromNick', 'boss', 'tank', 'secs', 'status', 'winnerNick', 'winnerSecs', 'tries'],
  Parcels:    ['pid', 'time', 'fromId', 'fromNick', 'toId', 'toNick', 'kind', 'amount', 'claimed']
};
var SH_BOSSES = ['krot', 'hornet', 'dragon', 'crypt'];
var SH_KINDS = { scrap: [50, 500], rep: [1, 1], ammo: [1, 1] };
var SH_LIMITS = { parcelsPerDay: 5, openChallenges: 5, challengeDays: 14, cardMax: 4000 };

function shErr(e) { return { ok: false, err: e }; }
function shNum(v) { var n = Number(v); return isFinite(n) ? n : 0; }
function shLow(s) { return String(s || '').trim().toLowerCase(); }
function shNickOk(n) { return typeof n === 'string' && /^[0-9A-Za-zА-Яа-яЁё _\-.]{2,16}$/.test(n) && n.trim() === n; }
function shRid(now) { return now.toString(36) + Math.floor(Math.random() * 1e9).toString(36); }

function shPlayer(db, id) { var r = db.rows('Players'); for (var i = 0; i < r.length; i++) if (String(r[i].id) === String(id)) return r[i]; return null; }
function shByNick(db, nick) { var r = db.rows('Players'), n = shLow(nick); for (var i = 0; i < r.length; i++) if (shLow(r[i].nick) === n) return r[i]; return null; }
function shAuth(db, p, hash) { if (!p.id || !p.key) return null; var pl = shPlayer(db, p.id); return pl && pl.keyHash === hash(String(p.key)) ? pl : null; }
function shTouch(db, pl, now) { pl.lastSeen = now; db.update('Players', pl); }
function shBest(db, id) { var b = {}; db.rows('Records').forEach(function (r) { if (String(r.id) !== String(id)) return; var s = shNum(r.secs); if (!b[r.boss] || s < b[r.boss].secs) b[r.boss] = { secs: s, tank: r.tank }; }); return b; }

function shHandle(db, p, now, hash) {
  var a = p.a || '';
  if (a === 'ping') return { ok: true, ver: SH_VER };

  if (a === 'reg') {
    if (!p.id || !/^[A-Za-z0-9_-]{8,40}$/.test(p.id) || !p.key || String(p.key).length < 12) return shErr('bad');
    if (!shNickOk(p.nick)) return shErr('nick');
    var other = shByNick(db, p.nick), pl = shPlayer(db, p.id);
    if (other && (!pl || other.id !== pl.id)) return shErr('nick_taken');
    if (pl) { if (pl.keyHash !== hash(String(p.key))) return shErr('auth'); pl.nick = p.nick; pl.lastSeen = now; db.update('Players', pl); }
    else db.append('Players', { id: p.id, nick: p.nick, keyHash: hash(String(p.key)), created: now, lastSeen: now, rank: 0, missions: 0, card: '' });
    return { ok: true, nick: p.nick };
  }

  if (a === 'top') {
    var best = {}, players = db.rows('Players'), nickOf = {};
    players.forEach(function (x) { nickOf[x.id] = x.nick; });
    db.rows('Records').forEach(function (r) {
      if (SH_BOSSES.indexOf(r.boss) < 0 || !nickOf[r.id]) return; var k = r.boss + '|' + r.id, s = shNum(r.secs);
      if (!best[k] || s < best[k].secs) best[k] = { boss: r.boss, nick: nickOf[r.id], tank: r.tank, secs: s, time: shNum(r.time) };
    });
    var bosses = {}; SH_BOSSES.forEach(function (b) { bosses[b] = []; });
    Object.keys(best).forEach(function (k) { bosses[best[k].boss].push(best[k]); });
    SH_BOSSES.forEach(function (b) { bosses[b].sort(function (x, y) { return x.secs - y.secs; }); bosses[b] = bosses[b].slice(0, 10); });
    var ranks = players.filter(function (x) { return shNum(x.missions) > 0; })
      .sort(function (x, y) { return shNum(y.missions) - shNum(x.missions) || shNum(x.created) - shNum(y.created); })
      .slice(0, 10).map(function (x) { return { nick: x.nick, rank: shNum(x.rank), missions: shNum(x.missions) }; });
    var recent = players.slice().sort(function (x, y) { return shNum(y.lastSeen) - shNum(x.lastSeen); }).slice(0, 30).map(function (x) { return x.nick; });
    return { ok: true, bosses: bosses, ranks: ranks, recent: recent };
  }

  if (a === 'getCard') {
    var t = shByNick(db, p.nick); if (!t) return shErr('no_nick');
    var card = null; try { card = t.card ? JSON.parse(t.card) : null; } catch (e) { card = null; }
    return { ok: true, nick: t.nick, rank: shNum(t.rank), missions: shNum(t.missions), lastSeen: shNum(t.lastSeen), card: card, best: shBest(db, t.id) };
  }

  if (a === 'chList') {
    var since = now - SH_LIMITS.challengeDays * 864e5;
    var list = db.rows('Challenges').filter(function (c) { return shNum(c.time) >= since; })
      .sort(function (x, y) { return shNum(y.time) - shNum(x.time); }).slice(0, 40)
      .map(function (c) { return { cid: c.cid, from: c.fromNick, mine: String(c.fromId) === String(p.id || ''), boss: c.boss, tank: c.tank, secs: shNum(c.secs), status: c.status, winner: c.winnerNick || '', winnerSecs: shNum(c.winnerSecs), tries: shNum(c.tries), time: shNum(c.time) }; });
    return { ok: true, list: list };
  }

  /* ---- everything below needs id + key ---- */
  var me = shAuth(db, p, hash); if (!me) return shErr('auth');

  if (a === 'rec') {
    var secs = shNum(p.secs); if (SH_BOSSES.indexOf(p.boss) < 0 || secs < 10 || secs > 7200) return shErr('bad');
    var prev = shBest(db, me.id)[p.boss];
    db.append('Records', { time: now, id: me.id, nick: me.nick, boss: p.boss, tank: String(p.tank || '').slice(0, 12), secs: Math.round(secs * 10) / 10, kills: shNum(p.kills), rank: shNum(p.rank), ver: String(p.ver || '').slice(0, 12) });
    if (shNum(p.rank) > shNum(me.rank)) me.rank = shNum(p.rank);
    shTouch(db, me, now);
    var top = shHandle(db, { a: 'top' }, now, hash).bosses[p.boss], place = 0;
    for (var i = 0; i < top.length; i++) if (top[i].nick === me.nick) { place = i + 1; break; }
    return { ok: true, best: !prev || secs < prev.secs, prevSecs: prev ? prev.secs : 0, place: place };
  }

  if (a === 'chNew') {
    var s2 = shNum(p.secs); if (SH_BOSSES.indexOf(p.boss) < 0 || s2 < 10) return shErr('bad');
    var open = db.rows('Challenges').filter(function (c) { return String(c.fromId) === String(me.id) && c.status === 'open'; }).length;
    if (open >= SH_LIMITS.openChallenges) return shErr('limit');
    var cid = 'c' + shRid(now);
    db.append('Challenges', { cid: cid, time: now, fromId: me.id, fromNick: me.nick, boss: p.boss, tank: String(p.tank || '').slice(0, 12), secs: Math.round(s2 * 10) / 10, status: 'open', winnerNick: '', winnerSecs: '', tries: 0 });
    shTouch(db, me, now); return { ok: true, cid: cid };
  }

  if (a === 'chTry') {
    var ch = null; db.rows('Challenges').forEach(function (c) { if (c.cid === p.cid) ch = c; });
    if (!ch) return shErr('no_challenge'); if (String(ch.fromId) === String(me.id)) return shErr('own');
    if (ch.status !== 'open') return { ok: true, won: false, closed: true, winner: ch.winnerNick };
    var s3 = shNum(p.secs); ch.tries = shNum(ch.tries) + 1;
    var won = s3 >= 10 && s3 < shNum(ch.secs) && ch.boss === p.boss;
    if (won) { ch.status = 'beaten'; ch.winnerNick = me.nick; ch.winnerSecs = Math.round(s3 * 10) / 10; }
    db.update('Challenges', ch); shTouch(db, me, now); return { ok: true, won: won, target: shNum(ch.secs) };
  }

  if (a === 'send') {
    var k = SH_KINDS[p.kind], amt = Math.floor(shNum(p.amount)); if (!k || amt < k[0] || amt > k[1]) return shErr('bad');
    var to = shByNick(db, p.to); if (!to) return shErr('no_nick'); if (to.id === me.id) return shErr('self');
    var day = now - 864e5, sent = db.rows('Parcels').filter(function (x) { return String(x.fromId) === String(me.id) && shNum(x.time) >= day; }).length;
    if (sent >= SH_LIMITS.parcelsPerDay) return shErr('limit');
    db.append('Parcels', { pid: 'p' + shRid(now), time: now, fromId: me.id, fromNick: me.nick, toId: to.id, toNick: to.nick, kind: p.kind, amount: amt, claimed: '' });
    shTouch(db, me, now); return { ok: true, to: to.nick, left: SH_LIMITS.parcelsPerDay - sent - 1 };
  }

  if (a === 'inbox') {
    var got = [];
    db.rows('Parcels').forEach(function (x) { if (String(x.toId) === String(me.id) && !x.claimed) { x.claimed = now; db.update('Parcels', x); got.push({ from: x.fromNick, kind: x.kind, amount: shNum(x.amount) }); } });
    shTouch(db, me, now); return { ok: true, parcels: got };
  }

  if (a === 'card') {
    var c2 = String(p.card || ''); if (c2.length > SH_LIMITS.cardMax) return shErr('bad');
    try { JSON.parse(c2); } catch (e) { return shErr('bad'); }
    me.card = c2; me.rank = shNum(p.rank); me.missions = shNum(p.missions); me.lastSeen = now; db.update('Players', me);
    return { ok: true };
  }

  return shErr('unknown');
}
