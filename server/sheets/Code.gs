/* Шаротанк Онлайн — сервер «Онлайн рейтинга» для Google Таблиц. Файл собран tools/build-gas.mjs из core.js + gas.js — правьте их. */

/* Фильтр мата и ругательств (русский + английский) для сообщений «Онлайн рейтинга». Часть Code.gs (собирается tools/build-gas.mjs).
   shClean(text) → {text, bad}: запрещённые слова заменены случайными символами той же длины, bad — найдено ли что-то.
   Ловит обходы: латиница вместо кириллицы (xyй, cyka), цифры (3,0,4,6…), разделители внутри слова (х*й, п.и.з.д.а),
   буквы через пробел (х у й), повторы букв (хууууй). Ложных срабатываний на «страхую», «употреблять», «небо», «мандарин» нет. */
var SH_TO_CYR = { a: 'а', b: 'б', c: 'с', e: 'е', h: 'н', k: 'к', m: 'м', o: 'о', p: 'р', t: 'т', x: 'х', y: 'у', u: 'и', n: 'п', r: 'г', '3': 'з', '0': 'о', '4': 'ч', '6': 'б', '@': 'а', '$': 'с', 'ё': 'е', 'й': 'й' };
var SH_TO_LAT = { 'а': 'a', 'в': 'b', 'с': 'c', 'е': 'e', 'ё': 'e', 'н': 'h', 'к': 'k', 'м': 'm', 'о': 'o', 'р': 'p', 'т': 't', 'х': 'x', 'у': 'y', 'и': 'u', '0': 'o', '1': 'i', '!': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't', '@': 'a', '$': 's' };
/* phonetic transliteration (blyat, pizdec, suka, nahuy) */
var SH_DIG = [['shch', 'щ'], ['sch', 'щ'], ['ya', 'я'], ['yo', 'е'], ['yu', 'ю'], ['ch', 'ч'], ['sh', 'ш'], ['zh', 'ж'], ['kh', 'х'], ['ts', 'ц'], ['ye', 'е']];
var SH_PHON = { a: 'а', b: 'б', v: 'в', w: 'в', g: 'г', d: 'д', e: 'е', z: 'з', i: 'и', j: 'й', y: 'й', k: 'к', l: 'л', m: 'м', n: 'н', o: 'о', p: 'п', r: 'р', s: 'с', t: 'т', u: 'у', f: 'ф', h: 'х', x: 'х', c: 'ц', q: 'к', '3': 'з', '0': 'о', '4': 'ч', '6': 'б', '@': 'а', '$': 'с', 'ё': 'е' };
function shPhon(w) { w = w.toLowerCase(); for (var i = 0; i < SH_DIG.length; i++) w = w.split(SH_DIG[i][0]).join(SH_DIG[i][1]); return w; }
var SH_BAD_RU = [
  /ху[йяеиюё]/, /п[ие]зд/, /бляд/, /блят/, /(?:^|[^еоаирг])бля/, /(?:^|[^нсрлхтгдк])еб(?:ан|уч|л[оияа]|ат|аш|ал|н|и[сш]|ок|ыр)/,
  /^(?:за|вы|у|до|об|от|на|по|при|про|раз|рас|съ|въ|под|пере|недо|из|вз|с|отъ|подъ|разъ)ъ?еб(?:а|у|л|н|ок|он|ош|ыр|ись|ет|ут|ен)/,
  /долб[ао]еб/, /муд[аои]к/, /мудил/, /мудозв/, /п[ие]д[оа]?р/, /педик/, /педераст/, /пидр/, /г[ао]ндон/, /залуп/, /манд[ауоеыи](?!рин|ат)/,
  /шлюх/, /^сук(?:а|и|е|у|ой|ам|ами|ах|ин|ина|ины|ино)$/, /сучк/, /сучар/, /сучь/, /дроч/, /говн/, /говен/, /жоп/, /шалав/, /^хер$/, /херн/, /херов/,
  /^чмо/, /уеб/, /ублюд/, /выбляд/, /дебил/, /дибил/, /кретин/, /идиот/, /имбецил/, /^урод/, /падл/, /гнида/, /мраз[ьи]/, /^тварь/, /пидарас/, /пидорас/, /шмар/, /курв/];
var SH_BAD_EN = [/fuck/, /fuk/, /fck/, /phuck/, /shit/, /bitch/, /cunt/, /^dick/, /dickhead/, /^cock(?!pit|tail|roach|er)/, /puss(?:y|ies)/, /asshole/, /^ass$/, /bastard/, /whore/, /slut/,
  /^fag/, /nigg/, /motherf/, /wank/, /twat/, /retard/, /dumbass/, /douche/, /^prick/, /bollock/];
var SH_SKIP = /страх|скорбл|употреб|корабл|сабл|грабл|хлеб|небо|себе|ребен|мандарин|мандат|хулиган|хутор|кукушк|утвар/;
var SH_MASK = '#@%&*!$?§¤';

function shNorm(word, map) { var s = '', prev = ''; word = word.toLowerCase();
  for (var i = 0; i < word.length; i++) { var c = word[i], m = map[c] != null ? map[c] : c; if (!/[a-zа-яё]/.test(m)) continue; if (m === prev) continue; s += m; prev = m; }
  return s; }
function shBadRu(ru) { if (!ru || SH_SKIP.test(ru)) return false; for (var i = 0; i < SH_BAD_RU.length; i++) if (SH_BAD_RU[i].test(ru)) return true; return false; }
function shBadWord(w) { if (!w) return false; var en = shNorm(w, SH_TO_LAT);
  if (shBadRu(shNorm(w, SH_TO_CYR)) || (/[a-z]/i.test(w) && shBadRu(shNorm(shPhon(w), SH_PHON)))) return true;
  if (en) for (var j = 0; j < SH_BAD_EN.length; j++) if (SH_BAD_EN[j].test(en)) return true;
  return false; }
function shMask(n) { var s = ''; for (var i = 0; i < n; i++) s += SH_MASK[Math.floor(Math.random() * SH_MASK.length)]; return s; }
function shClean(text) {
  var parts = String(text).split(/(\s+)/), bad = false, i, j;
  /* letters typed one by one with spaces/dots between them: «х у й», «f u c k» */
  for (i = 0; i < parts.length; i++) {
    if (/\s/.test(parts[i]) || parts[i].length > 2) continue;
    var run = [i]; for (j = i + 2; j < parts.length && !/\s/.test(parts[j]) && parts[j].length <= 2; j += 2) run.push(j);
    if (run.length >= 3) { var joined = run.map(function (k) { return parts[k]; }).join('');
      if (shBadWord(joined)) { bad = true; run.forEach(function (k) { parts[k] = shMask(parts[k].length); }); } i = j - 1; }
  }
  for (i = 0; i < parts.length; i++) { if (/\s/.test(parts[i]) || /^[#@%&*!$?§¤]+$/.test(parts[i])) continue;
    if (shBadWord(parts[i])) { bad = true; parts[i] = shMask(parts[i].length); continue; }
    /* glued words: check each run of letters split by punctuation too («нахуй!», «бля,») */
    var sub = parts[i].split(/([^0-9A-Za-zА-Яа-яЁё@$!*]+)/);
    if (sub.length > 1) { var hit = false; for (j = 0; j < sub.length; j++) if (j % 2 === 0 && shBadWord(sub[j])) { sub[j] = shMask(sub[j].length); hit = true; }
      if (hit) { bad = true; parts[i] = sub.join(''); } } }
  return { text: parts.join(''), bad: bad };
}

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
var SH_VER = 3;
var SH_COLS = {
  Pilots:   ['id', 'nick', 'pinHash', 'created', 'lastSeen', 'av', 'score', 'kills', 'kbt', 'deaths', 'med', 'tank', 'tlv', 'rank', 'missions', 'friends', 'fails', 'lockT', 'muteT'],
  Messages: ['mid', 'time', 'fromId', 'fromNick', 'toId', 'toNick', 'kind', 'text', 'amount', 'got']
};
var SH_LIM = { msgLen: 50, msgPerDay: 100, msgPerMin: 10, muteH: 24, seenMin: 4, topSecs: 60, scrapPerDay: 5, scrapMin: 10, scrapMax: 1000, keepDays: 7, fails: 5, lockMin: 10, friends: 50, medal: 50, top: 300, log: 30 };

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
function shFlagKey(nick) { return 'in:' + shLow(nick); }
function shInbox(db, me, now) { var inbox = [];
  db.rows('Messages').forEach(function (m) { if (String(m.toId) === String(me.id) && !m.got) { m.got = now; db.update('Messages', m); inbox.push({ from: m.fromNick, kind: m.kind, text: m.text || '', amount: shNum(m.amount), time: shNum(m.time) }); } });
  if (db.flagSet) db.flagSet(shFlagKey(me.nick), null); return inbox; }
function shSince(db, me, kind, since) { return db.rows('Messages').filter(function (m) { return String(m.fromId) === String(me.id) && m.kind === kind && shNum(m.time) >= since; }).length; }
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

  /* cheap inbox check: without a "new mail" flag in the cache there is nothing to read — no sheet access at all */
  if (a === 'poll' && db.flagGet && !db.flagGet(shFlagKey(p.nick))) return { ok: true, inbox: [] };

  if (a === 'top') {
    var hit = db.cacheGet && db.cacheGet('top', now); if (hit) return JSON.parse(hit);
    var list = db.rows('Pilots').slice().sort(function (x, y) { return shNum(y.score) - shNum(x.score) || shNum(x.created) - shNum(y.created); }).slice(0, SH_LIM.top)
      .map(function (x) { return { n: x.nick, av: shAv(x.av), s: shNum(x.score), k: shNum(x.kills), m: shJ(x.med, []).length, t: x.tank || '', seen: shNum(x.lastSeen) }; });
    var res = { ok: true, list: list, now: now }; if (db.cachePut) db.cachePut('top', JSON.stringify(res), SH_LIM.topSecs, now);
    return res;
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
    return { ok: true, to: to.nick, text: msg.text, muted: muted ? shNum(me2.muteT) : 0, left: p.kind === 'scrap' ? SH_LIM.scrapPerDay - shToday(db, me2, 'scrap', now) : SH_LIM.msgPerDay - shToday(db, me2, 'msg', now) };
  }

  return shErr('unknown');
}

/* ---- Apps Script adapter: Google Sheets as the database, a web app as the API ----
   Deploy: Расширения → Apps Script → вставить Code.gs целиком → Развертывание → Новое развертывание →
   «Веб-приложение», «Выполнять как: я», «У кого есть доступ: все» → скопировать адрес …/exec. */
/* Read-only requests (ping, rating, a card without login, an empty inbox poll) go without the lock and mostly without
   touching the sheet at all: the rating is cached for 60 s, "new mail" is a flag in CacheService. */
var GAS_RO = { ping: 1, top: 1 };
function doGet(e) {
  var p = (e && e.parameter) || {}, out, lock = null, now = Date.now();
  try {
    var ro = GAS_RO[p.a] || (p.a === 'card' && !p.pin) || (p.a === 'poll' && !gasCache().get(shFlagKey(p.nick)));
    if (!ro) { lock = LockService.getScriptLock(); lock.waitLock(15000); }
    out = shHandle(gasDb(), p, now, gasHash);
  }
  catch (err) { out = { ok: false, err: 'server', msg: String(err && err.message || err) }; }
  finally { if (lock) try { lock.releaseLock(); } catch (_) {} }
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}
function doPost(e) { return doGet(e); }

function gasHash(s) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, s, Utilities.Charset.UTF_8)
    .map(function (b) { var h = ((b + 256) % 256).toString(16); return h.length < 2 ? '0' + h : h; }).join('');
}

function gasCache() { return CacheService.getScriptCache(); }
function gasDb() {
  var ss = null, cache = {}, sheets = {}, C = gasCache();
  function sheet(t) { if (sheets[t]) return sheets[t]; ss = ss || SpreadsheetApp.getActiveSpreadsheet(); var s = ss.getSheetByName(t), cols = SH_COLS[t];
    if (!s) { s = ss.insertSheet(t); s.appendRow(cols); s.setFrozenRows(1); }
    else if (s.getLastColumn() < cols.length) s.getRange(1, 1, 1, cols.length).setValues([cols]); /* a column was added in a newer version */
    return (sheets[t] = s); }
  return {
    flagGet: function (k) { return C.get(k); },
    flagSet: function (k, v) { if (v) C.put(k, v, 21600); else C.remove(k); },
    cacheGet: function (k) { return C.get('c:' + k); },
    cachePut: function (k, v, secs) { try { C.put('c:' + k, v, secs); } catch (_) { /* > 100 KB: skip caching */ } },
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
