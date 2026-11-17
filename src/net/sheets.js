/* Клиент сервера «Водителей» (Google Таблицы + Apps Script). Только GET: у веб-приложения Apps Script
   ответ приходит после редиректа на googleusercontent.com с CORS «*», а GET не требует preflight.
   Ответ всегда объект: {ok:true,...} или {ok:false, err:'код'}; сетевые сбои — err:'net', нет адреса — err:'nourl'. */
import { SHEETS } from './config.js';

export function sheetsUrl() {
  try { const q = new URLSearchParams(location.search).get('sheets'); if (q) return q; } catch (_) { /* file:// и т.п. */ }
  const c = window.SHT_NET_CFG; if (c && c.sheets) return c.sheets;
  return SHEETS.url || '';
}

export async function sheetsCall(a, params = {}, timeout = 20000) {
  const url = sheetsUrl(); if (!url) return { ok: false, err: 'nourl' };
  let u; try { u = new URL(url); } catch (_) { return { ok: false, err: 'nourl' }; }
  u.searchParams.set('a', a);
  for (const [k, v] of Object.entries(params)) if (v != null) u.searchParams.set(k, String(v));
  const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), timeout);
  try { const r = await fetch(u.toString(), { signal: ctl.signal, redirect: 'follow' }); const j = await r.json(); return j && typeof j === 'object' ? j : { ok: false, err: 'bad' }; }
  catch (_) { return { ok: false, err: 'net' }; }
  finally { clearTimeout(t); }
}
