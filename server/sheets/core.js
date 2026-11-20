/* Шаротанк Онлайн — «Онлайн рейтинг» (v2, v30.0): пилоты с PIN, общий рейтинг, карточки, друзья, сообщения, лом.
   Чистая логика без Google API: работает и в Apps Script (Code.gs собирается из этого файла + gas.js),
   и в тестовом мок-сервере (tests/net/sheets-mock.mjs). Хранилище — таблицы из строк-объектов:
     db.rows(t)          → массив объектов (поле _r — номер строки в листе)
     db.append(t, obj)   → добавить строку
     db.update(t, obj)   → переписать строку obj._r
     db.dropHead(t, n)   → удалить n первых (самых старых) строк
     db.flagGet/flagSet(k,v), db.cacheGet(k,now)/cachePut(k,v,secs,now) — быстрый кэш (CacheService в Apps Script), без чтения листов
   Все ответы — {ok:true,...} или {ok:false,err:'код'}.
   Вход: позывной + PIN из 4 цифр (на сервере только SHA-256 от id+PIN); 5 неверных PIN подряд → блок на 10 мин. */
var SH_VER = 5;
var SH_COLS = {
  Pilots:   ['id', 'nick', 'pinHash', 'created', 'lastSeen', 'av', 'score', 'kills', 'kbt', 'deaths', 'med', 'tank', 'tlv', 'rank', 'missions', 'friends', 'fails', 'lockT', 'muteT'],
  /* v30.9: read = when the addressee saw it, del = the sender deleted it (gone for both), hid = the addressee hid it (gone for him only) */
  Messages: ['mid', 'time', 'fromId', 'fromNick', 'toId', 'toNick', 'kind', 'text', 'amount', 'got', 'read', 'del', 'hid'],
  /* v30.6: news feed — rows are added by hand (or by Claude through the Sheets API): id, time (ms), title, text; votes = {pilotId: 1|-1} */
  News:     ['id', 'time', 'title', 'text', 'up', 'down', 'votes']
};
var SH_LIM = { msgLen: 50, msgPerDay: 100, msgPerMin: 10, muteH: 24, seenMin: 4, topSecs: 60, scrapPerDay: 5, scrapMin: 10, scrapMax: 1000, keepDays: 7, fails: 5, lockMin: 10, friends: 50, medal: 50, top: 300, log: 30, news: 50, newsSecs: 60, idleDays: 90, idleLowDays: 30, idleLowScore: 100 };
/* v30.9: the creator is always in the rating */
var SH_KEEP = ['amplin'];

function shErr(e) { return { ok: false, err: e }; }
function shNum(v) { var n = Number(v); return isFinite(n) ? n : 0; }
function shLow(s) { return String(s || '').trim().toLowerCase(); }
function shNickOk(n) { return typeof n === 'string' && /^[0-9A-Za-zА-Яа-яЁё _\-.]{2,16}$/.test(n) && n.trim() === n; }
function shPinOk(p) { return /^[0-9]{4}$/.test(String(p || '')); }
function shRid(now) { return now.toString(36) + Math.floor(Math.random() * 1e9).toString(36); }
function shJ(s, d) { try { var v = s ? JSON.parse(s) : d; return v == null ? d : v; } catch (e) { return d; } }
function shAv(v) { var n = Math.floor(shNum(v)); return n >= 0 && n < 9 ? n : 0; }

function shById(db, id) { var r = db.rows('Pilots'); for (var i = 0; i < r.length; i++) if (String(r[i].id) === String(id)) return r[i]; return null; }
function shByNick(db, nick) { var r = db.rows('Pilots'), n = shLow(nick); for (var i = 0; i < r.length; i++) if (shLow(r[i].nick) === n) return r[i]; return null; }
/* nick + pin → pilot, or an error code */
function shAuth(db, p, now, hash) {
  var pl = shByNick(db, p.nick); if (!pl || !shPinOk(p.pin)) return 'auth';
  if (shNum(pl.lockT) > now) return 'locked';
  if (pl.pinHash !== hash(pl.id + ':' + p.pin)) {
    pl.fails = shNum(pl.fails) + 1; if (pl.fails >= SH_LIM.fails) { pl.fails = 0; pl.lockT = now + SH_LIM.lockMin * 60000; }
    db.update('Pilots', pl); return 'auth';
  }
  if (shNum(pl.fails)) { pl.fails = 0; db.update('Pilots', pl); }
  return pl;
}
/* v30.9: who is shown in the rating — not seen for 90 days, or for 30 days with fewer than 100 points, is hidden (the pilot stays and comes back on the next visit) */
function shShown(x, now) { if (SH_KEEP.indexOf(shLow(x.nick)) >= 0) return true; var idle = now - shNum(x.lastSeen);
  if (idle > SH_LIM.idleDays * 864e5) return false; if (shNum(x.score) < SH_LIM.idleLowScore && idle > SH_LIM.idleLowDays * 864e5) return false; return true; }
function shScore(pl) { return shNum(pl.kills) + 50 * shJ(pl.med, []).length; }
function shFriends(db, pl) { var out = []; shJ(pl.friends, []).forEach(function (id) { var f = shById(db, id); if (f) out.push(f.nick); }); return out; }
function shMe(db, pl) { return { nick: pl.nick, av: shAv(pl.av), kills: shNum(pl.kills), kbt: shJ(pl.kbt, {}), deaths: shNum(pl.deaths), med: shJ(pl.med, []), friends: shFriends(db, pl), score: shNum(pl.score) }; }
function shPrune(db, now) { var r = db.rows('Messages'), old = now - SH_LIM.keepDays * 864e5, n = 0; while (n < r.length && shNum(r[n].time) < old) n++; if (n) db.dropHead('Messages', n); }
function shFlagKey(nick) { return 'in:' + shLow(nick); }
function shInbox(db, me, now) { var inbox = [];
  db.rows('Messages').forEach(function (m) { if (String(m.toId) === String(me.id) && !m.got) { m.got = now; db.update('Messages', m); if (!m.del && !m.hid) inbox.push({ mid: String(m.mid), from: m.fromNick, kind: m.kind, text: m.text || '', amount: shNum(m.amount), time: shNum(m.time) }); } });
  if (db.flagSet) db.flagSet(shFlagKey(me.nick), null); return inbox; }
function shSince(db, me, kind, since) { return db.rows('Messages').filter(function (m) { return String(m.fromId) === String(me.id) && m.kind === kind && shNum(m.time) >= since; }).length; }
function shToday(db, me, kind, now) { var day = now - 864e5; return db.rows('Messages').filter(function (m) { return String(m.fromId) === String(me.id) && m.kind === kind && shNum(m.time) >= day; }).length; }

/* news list for everyone (no login), newest last, cached for a minute */
function shNewsList(db, now) {
  var hit = db.cacheGet && db.cacheGet('news', now); if (hit) return JSON.parse(hit);
  var list = db.rows('News').filter(function (n) { return n.id !== '' && n.id != null && String(n.title || n.text || '').trim(); })
    .map(function (n) { var t = n.time instanceof Date ? n.time.getTime() : shNum(n.time); return { id: String(n.id), t: t, title: String(n.title || ''), text: String(n.text || ''), up: shNum(n.up), down: shNum(n.down) }; })
    .sort(function (a, b) { return a.t - b.t; }).slice(-SH_LIM.news);
  var res = { ok: true, news: list, now: now }; if (db.cachePut) db.cachePut('news', JSON.stringify(res), SH_LIM.newsSecs, now);
  return res;
}
function shHandle(db, p, now, hash) {
  var a = p.a || '';
  if (a === 'ping') return { ok: true, ver: SH_VER };

  if (a === 'reg') {
    if (!shNickOk(p.nick)) return shErr('nick'); if (!shPinOk(p.pin)) return shErr('pin');
    if (shByNick(db, p.nick)) return shErr('nick_taken');
    var id = 'p' + shRid(now);
    var pl = { id: id, nick: p.nick, pinHash: hash(id + ':' + p.pin), created: now, lastSeen: now, av: shAv(p.av), score: 0, kills: 0, kbt: '{}', deaths: 0, med: '[]', tank: '', tlv: '{}', rank: 0, missions: 0, friends: '[]', fails: 0, lockT: 0 };
    db.append('Pilots', pl); return { ok: true, me: shMe(db, pl) };
  }

  if (a === 'login') { var L = shAuth(db, p, now, hash); if (typeof L === 'string') return shErr(L); L.lastSeen = now; db.update('Pilots', L); return { ok: true, me: shMe(db, L) }; }

  /* cheap inbox check: without a "new mail" flag in the cache there is nothing to read — no sheet access at all */
  if (a === 'poll' && db.flagGet && !db.flagGet(shFlagKey(p.nick))) return { ok: true, inbox: [] };

  if (a === 'top') {
    var hit = db.cacheGet && db.cacheGet('top', now); if (hit) return JSON.parse(hit);
    var list = db.rows('Pilots').filter(function (x) { return shShown(x, now); }).sort(function (x, y) { return shNum(y.score) - shNum(x.score) || shNum(x.created) - shNum(y.created); }).slice(0, SH_LIM.top)
      .map(function (x) { return { n: x.nick, av: shAv(x.av), s: shNum(x.score), k: shNum(x.kills), m: shJ(x.med, []).length, t: x.tank || '', seen: shNum(x.lastSeen) }; });
    var res = { ok: true, list: list, now: now }; if (db.cachePut) db.cachePut('top', JSON.stringify(res), SH_LIM.topSecs, now);
    return res;
  }

  if (a === 'news') return shNewsList(db, now);

  if (a === 'card') {
    var t = shByNick(db, p.who); if (!t) return shErr('no_nick');
    var out = { ok: true, nick: t.nick, av: shAv(t.av), score: shNum(t.score), kills: shNum(t.kills), kbt: shJ(t.kbt, {}), deaths: shNum(t.deaths), med: shJ(t.med, []), tank: t.tank || '', tlv: shJ(t.tlv, {}), rank: shNum(t.rank), missions: shNum(t.missions), seen: shNum(t.lastSeen), now: now };
    if (p.nick && p.pin) { var me = shAuth(db, p, now, hash); if (typeof me !== 'string') {
      out.friend = shJ(me.friends, []).indexOf(t.id) >= 0;
      var old = now - SH_LIM.keepDays * 864e5, log = [];
      db.rows('Messages').forEach(function (m) { if (shNum(m.time) < old) return; var mine = String(m.fromId) === String(me.id) && String(m.toId) === String(t.id), his = String(m.fromId) === String(t.id) && String(m.toId) === String(me.id);
        if (m.del || (his && m.hid)) return;
        if (his && !m.read && String(p.rd) === '1') { m.read = now; db.update('Messages', m); } /* the chat is open on his screen = read (background warm-ups do not count) */
        if (mine || his) log.push({ mid: String(m.mid), out: mine, kind: m.kind, text: m.text || '', amount: shNum(m.amount), time: shNum(m.time), read: mine && shNum(m.read) ? 1 : 0 }); });
      out.log = log.slice(-SH_LIM.log); } }
    return out;
  }

  /* ---- everything below needs nick + pin ---- */
  var me2 = shAuth(db, p, now, hash); if (typeof me2 === 'string') return shErr(me2);

  if (a === 'poll') { var ib = shInbox(db, me2, now); return { ok: true, inbox: ib }; }

  if (a === 'sync') {
    me2._sig = [me2.kbt, me2.med, me2.kills, me2.deaths, me2.tank, me2.tlv, me2.av, me2.rank, me2.missions].join('|');
    /* counters only grow (several devices: each sends its own max after login merged the server values) */
    var kb = shJ(me2.kbt, {}), nk = shJ(p.kbt, {}); Object.keys(nk).forEach(function (k) { if (/^[a-z0-9]{2,12}$/.test(k)) kb[k] = Math.max(shNum(kb[k]), Math.floor(shNum(nk[k]))); });
    var md = shJ(me2.med, []); shJ(p.med, []).forEach(function (m) { if (/^[a-z0-9]{2,12}$/.test(m) && md.indexOf(m) < 0 && md.length < SH_LIM.medal) md.push(m); });
    me2.kbt = JSON.stringify(kb); me2.med = JSON.stringify(md);
    me2.kills = Math.max(shNum(me2.kills), Math.floor(shNum(p.kills))); me2.deaths = Math.max(shNum(me2.deaths), Math.floor(shNum(p.deaths)));
    if (p.tank) me2.tank = String(p.tank).slice(0, 12); if (p.tlv) { var tl = shJ(p.tlv, null); if (tl && typeof tl === 'object') me2.tlv = JSON.stringify(tl).slice(0, 400); }
    if (p.av != null && p.av !== '') me2.av = shAv(p.av);
    me2.rank = Math.max(shNum(me2.rank), shNum(p.rank)); me2.missions = Math.max(shNum(me2.missions), shNum(p.missions));
    me2.score = shScore(me2);
    /* write the row only when something changed (or «last seen» is getting old) — fewer sheet writes */
    var sig = [me2.kbt, me2.med, me2.kills, me2.deaths, me2.tank, me2.tlv, me2.av, me2.rank, me2.missions].join('|');
    if (sig !== me2._sig || now - shNum(me2.lastSeen) > SH_LIM.seenMin * 60000) { me2.lastSeen = now; db.update('Pilots', me2); }
    var inbox = shInbox(db, me2, now);
    shPrune(db, now);
    return { ok: true, inbox: inbox, me: shMe(db, me2) };
  }

  if (a === 'friend') {
    var f = shByNick(db, p.who); if (!f) return shErr('no_nick'); if (f.id === me2.id) return shErr('self');
    var fr = shJ(me2.friends, []), i = fr.indexOf(f.id);
    if (p.on === '1' && i < 0) { if (fr.length >= SH_LIM.friends) return shErr('limit'); fr.push(f.id); }
    if (p.on !== '1' && i >= 0) fr.splice(i, 1);
    me2.friends = JSON.stringify(fr); db.update('Pilots', me2); return { ok: true, friends: shFriends(db, me2) };
  }

  if (a === 'send') {
    var to = shByNick(db, p.to); if (!to) return shErr('no_nick'); if (to.id === me2.id) return shErr('self');
    if (shJ(me2.friends, []).indexOf(to.id) < 0) return shErr('not_friend');
    var msg = { mid: 'm' + shRid(now), time: now, fromId: me2.id, fromNick: me2.nick, toId: to.id, toNick: to.nick, kind: p.kind, text: '', amount: 0, got: '' };
    var muted = false;
    if (p.kind === 'msg') {
      if (shNum(me2.muteT) > now) return { ok: false, err: 'muted', until: shNum(me2.muteT) };
      var tx = String(p.text || '').replace(/\s+/g, ' ').trim(); if (!tx || tx.length > SH_LIM.msgLen) return shErr('bad');
      if (shSince(db, me2, 'msg', now - 60000) >= SH_LIM.msgPerMin) return shErr('spam');
      if (shToday(db, me2, 'msg', now) >= SH_LIM.msgPerDay) return shErr('limit');
      var cl = shClean(tx); msg.text = cl.text; if (cl.bad) { me2.muteT = now + SH_LIM.muteH * 3600000; muted = true; }
    } else if (p.kind === 'scrap') {
      var amt = Math.floor(shNum(p.amount)); if (amt < SH_LIM.scrapMin || amt > SH_LIM.scrapMax) return shErr('bad');
      if (shToday(db, me2, 'scrap', now) >= SH_LIM.scrapPerDay) return shErr('limit'); msg.amount = amt;
    } else return shErr('bad');
    db.append('Messages', msg); me2.lastSeen = now; db.update('Pilots', me2); if (db.flagSet) db.flagSet(shFlagKey(to.nick), '1');
    return { ok: true, mid: msg.mid, to: to.nick, text: msg.text, muted: muted ? shNum(me2.muteT) : 0, left: p.kind === 'scrap' ? SH_LIM.scrapPerDay - shToday(db, me2, 'scrap', now) : SH_LIM.msgPerDay - shToday(db, me2, 'msg', now) };
  }

  /* v30.9: delete a message — your own one disappears for both, a received one only for you */
  if (a === 'del') {
    var dm = null; db.rows('Messages').forEach(function (m) { if (String(m.mid) === String(p.mid)) dm = m; }); if (!dm) return { ok: true, gone: 1 };
    if (String(dm.fromId) === String(me2.id)) dm.del = now; else if (String(dm.toId) === String(me2.id)) dm.hid = now; else return shErr('no_msg');
    db.update('Messages', dm); return { ok: true };
  }

  if (a === 'vote') {
    var nw = null; db.rows('News').forEach(function (n) { if (String(n.id) === String(p.id)) nw = n; }); if (!nw) return shErr('no_news');
    var v = Number(p.v), vs = shJ(nw.votes, {}); if (v === 1 || v === -1) vs[me2.id] = v; else delete vs[me2.id];
    var up = 0, dn = 0; Object.keys(vs).forEach(function (k) { if (vs[k] === 1) up++; else if (vs[k] === -1) dn++; });
    nw.votes = JSON.stringify(vs); nw.up = up; nw.down = dn; db.update('News', nw);
    if (db.cachePut) db.cachePut('news', '', 1, now); /* drop the cached list */
    return { ok: true, id: String(nw.id), up: up, down: dn, my: vs[me2.id] || 0 };
  }

  return shErr('unknown');
}
