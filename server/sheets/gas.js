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
