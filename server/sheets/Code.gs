/* Шаротанк Онлайн — сервер «Онлайн рейтинга» для Google Таблиц. Файл собран tools/build-gas.mjs из core.js + gas.js — правьте их. */

/* Шаротанк Онлайн — «Онлайн рейтинг» (v2, v30.0): пилоты с PIN, общий рейтинг, карточки, друзья, сообщения, лом.
   Чистая логика без Google API: работает и в Apps Script (Code.gs собирается из этого файла + gas.js),
   и в тестовом мок-сервере (tests/net/sheets-mock.mjs). Хранилище — таблицы из строк-объектов:
     db.rows(t)          → массив объектов (поле _r — номер строки в листе)
     db.append(t, obj)   → добавить строку
     db.update(t, obj)   → переписать строку obj._r
     db.dropHead(t, n)   → удалить n первых (самых старых) строк
   Все ответы — {ok:true,...} или {ok:false,err:'код'}.
   Вход: позывной + PIN из 4 цифр (на сервере только SHA-256 от id+PIN); 5 неверных PIN подряд → блок на 10 мин. */
var SH_VER = 2;
var SH_COLS = {
  Pilots:   ['id', 'nick', 'pinHash', 'created', 'lastSeen', 'av', 'score', 'kills', 'kbt', 'deaths', 'med', 'tank', 'tlv', 'rank', 'missions', 'friends', 'fails', 'lockT'],
  Messages: ['mid', 'time', 'fromId', 'fromNick', 'toId', 'toNick', 'kind', 'text', 'amount', 'got']
};
var SH_LIM = { msgLen: 50, msgPerDay: 60, scrapPerDay: 5, scrapMin: 10, scrapMax: 1000, keepDays: 7, fails: 5, lockMin: 10, friends: 50, medal: 50, top: 300, log: 30 };

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
function shScore(pl) { return shNum(pl.kills) + 50 * shJ(pl.med, []).length; }
function shFriends(db, pl) { var out = []; shJ(pl.friends, []).forEach(function (id) { var f = shById(db, id); if (f) out.push(f.nick); }); return out; }
function shMe(db, pl) { return { nick: pl.nick, av: shAv(pl.av), kills: shNum(pl.kills), kbt: shJ(pl.kbt, {}), deaths: shNum(pl.deaths), med: shJ(pl.med, []), friends: shFriends(db, pl), score: shNum(pl.score) }; }
function shPrune(db, now) { var r = db.rows('Messages'), old = now - SH_LIM.keepDays * 864e5, n = 0; while (n < r.length && shNum(r[n].time) < old) n++; if (n) db.dropHead('Messages', n); }
function shToday(db, me, kind, now) { var day = now - 864e5; return db.rows('Messages').filter(function (m) { return String(m.fromId) === String(me.id) && m.kind === kind && shNum(m.time) >= day; }).length; }

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

  if (a === 'top') {
    var list = db.rows('Pilots').slice().sort(function (x, y) { return shNum(y.score) - shNum(x.score) || shNum(x.created) - shNum(y.created); }).slice(0, SH_LIM.top)
      .map(function (x) { return { n: x.nick, av: shAv(x.av), s: shNum(x.score), k: shNum(x.kills), m: shJ(x.med, []).length, t: x.tank || '', seen: shNum(x.lastSeen) }; });
    return { ok: true, list: list, now: now };
  }

  if (a === 'card') {
    var t = shByNick(db, p.who); if (!t) return shErr('no_nick');
    var out = { ok: true, nick: t.nick, av: shAv(t.av), score: shNum(t.score), kills: shNum(t.kills), kbt: shJ(t.kbt, {}), deaths: shNum(t.deaths), med: shJ(t.med, []), tank: t.tank || '', tlv: shJ(t.tlv, {}), rank: shNum(t.rank), missions: shNum(t.missions), seen: shNum(t.lastSeen), now: now };
    if (p.nick && p.pin) { var me = shAuth(db, p, now, hash); if (typeof me !== 'string') {
      out.friend = shJ(me.friends, []).indexOf(t.id) >= 0;
      var old = now - SH_LIM.keepDays * 864e5, log = [];
      db.rows('Messages').forEach(function (m) { if (shNum(m.time) < old) return; var mine = String(m.fromId) === String(me.id) && String(m.toId) === String(t.id), his = String(m.fromId) === String(t.id) && String(m.toId) === String(me.id);
        if (mine || his) log.push({ out: mine, kind: m.kind, text: m.text || '', amount: shNum(m.amount), time: shNum(m.time) }); });
      out.log = log.slice(-SH_LIM.log); } }
    return out;
  }

  /* ---- everything below needs nick + pin ---- */
  var me2 = shAuth(db, p, now, hash); if (typeof me2 === 'string') return shErr(me2);

  if (a === 'sync') {
    /* counters only grow (several devices: each sends its own max after login merged the server values) */
    var kb = shJ(me2.kbt, {}), nk = shJ(p.kbt, {}); Object.keys(nk).forEach(function (k) { if (/^[a-z0-9]{2,12}$/.test(k)) kb[k] = Math.max(shNum(kb[k]), Math.floor(shNum(nk[k]))); });
    var md = shJ(me2.med, []); shJ(p.med, []).forEach(function (m) { if (/^[a-z0-9]{2,12}$/.test(m) && md.indexOf(m) < 0 && md.length < SH_LIM.medal) md.push(m); });
    me2.kbt = JSON.stringify(kb); me2.med = JSON.stringify(md);
    me2.kills = Math.max(shNum(me2.kills), Math.floor(shNum(p.kills))); me2.deaths = Math.max(shNum(me2.deaths), Math.floor(shNum(p.deaths)));
    if (p.tank) me2.tank = String(p.tank).slice(0, 12); if (p.tlv) { var tl = shJ(p.tlv, null); if (tl && typeof tl === 'object') me2.tlv = JSON.stringify(tl).slice(0, 400); }
    if (p.av != null && p.av !== '') me2.av = shAv(p.av);
    me2.rank = Math.max(shNum(me2.rank), shNum(p.rank)); me2.missions = Math.max(shNum(me2.missions), shNum(p.missions));
    me2.score = shScore(me2); me2.lastSeen = now; db.update('Pilots', me2);
    var inbox = [];
    db.rows('Messages').forEach(function (m) { if (String(m.toId) === String(me2.id) && !m.got) { m.got = now; db.update('Messages', m); inbox.push({ from: m.fromNick, kind: m.kind, text: m.text || '', amount: shNum(m.amount), time: shNum(m.time) }); } });
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
    if (p.kind === 'msg') {
      var tx = String(p.text || '').replace(/\s+/g, ' ').trim(); if (!tx || tx.length > SH_LIM.msgLen) return shErr('bad');
      if (shToday(db, me2, 'msg', now) >= SH_LIM.msgPerDay) return shErr('limit'); msg.text = tx;
    } else if (p.kind === 'scrap') {
      var amt = Math.floor(shNum(p.amount)); if (amt < SH_LIM.scrapMin || amt > SH_LIM.scrapMax) return shErr('bad');
      if (shToday(db, me2, 'scrap', now) >= SH_LIM.scrapPerDay) return shErr('limit'); msg.amount = amt;
    } else return shErr('bad');
    db.append('Messages', msg); me2.lastSeen = now; db.update('Pilots', me2);
    return { ok: true, to: to.nick, left: p.kind === 'scrap' ? SH_LIM.scrapPerDay - shToday(db, me2, 'scrap', now) : SH_LIM.msgPerDay - shToday(db, me2, 'msg', now) };
  }

  return shErr('unknown');
}

/* ---- Apps Script adapter: Google Sheets as the database, a web app as the API ----
   Deploy: Расширения → Apps Script → вставить Code.gs целиком → Развертывание → Новое развертывание →
   «Веб-приложение», «Выполнять как: я», «У кого есть доступ: все» → скопировать адрес …/exec. */
function doGet(e) {
  var p = (e && e.parameter) || {}, out, lock = LockService.getScriptLock();
  try { lock.waitLock(15000); out = shHandle(gasDb(), p, Date.now(), gasHash); }
  catch (err) { out = { ok: false, err: 'server', msg: String(err && err.message || err) }; }
  finally { try { lock.releaseLock(); } catch (_) {} }
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}
function doPost(e) { return doGet(e); }

function gasHash(s) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, s, Utilities.Charset.UTF_8)
    .map(function (b) { var h = ((b + 256) % 256).toString(16); return h.length < 2 ? '0' + h : h; }).join('');
}

function gasDb() {
  var ss = SpreadsheetApp.getActiveSpreadsheet(), cache = {};
  function sheet(t) { var s = ss.getSheetByName(t); if (!s) { s = ss.insertSheet(t); s.appendRow(SH_COLS[t]); s.setFrozenRows(1); } return s; }
  return {
    rows: function (t) {
      if (cache[t]) return cache[t];
      var s = sheet(t), n = s.getLastRow(), cols = SH_COLS[t], out = [];
      if (n > 1) s.getRange(2, 1, n - 1, cols.length).getValues().forEach(function (v, i) {
        var o = { _r: i + 2 }; cols.forEach(function (c, j) { o[c] = v[j]; }); out.push(o); });
      return (cache[t] = out);
    },
    append: function (t, obj) {
      var s = sheet(t), cols = SH_COLS[t]; s.appendRow(cols.map(function (c) { return obj[c] == null ? '' : obj[c]; }));
      obj._r = s.getLastRow(); if (cache[t]) cache[t].push(obj);
    },
    update: function (t, obj) {
      var cols = SH_COLS[t]; sheet(t).getRange(obj._r, 1, 1, cols.length).setValues([cols.map(function (c) { return obj[c] == null ? '' : obj[c]; })]);
    },
    dropHead: function (t, n) { if (n > 0) { sheet(t).deleteRows(2, n); cache[t] = null; } }
  };
}

/* Run once from the editor (▶ setup) if the tabs are missing. */
function setup() { var db = gasDb(); Object.keys(SH_COLS).forEach(function (t) { db.rows(t); }); }
