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
