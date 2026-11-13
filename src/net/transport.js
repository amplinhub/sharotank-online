/* Транспорт онлайна: тонкий слой над WebRTC DataChannel (PeerJS).
   Игра знает только этот интерфейс (host / join / send / onMessage / onClose / close) —
   реализацию (PeerJS-облако, свой сигнальный сервер, позже запасной ретранслятор) можно заменить,
   не трогая лобби и игру.

   Сообщения — JSON-объекты. Служебные сообщения (`__hb`) наружу не отдаются.

   Настройка сервера сигналинга (по умолчанию — публичное PeerJS-облако):
     window.SHT_NET_CFG = { host, port, path, secure, iceServers }   (тесты ставят localhost)
   или параметры адреса ?sig=host:port  */
import Peer from 'peerjs';
import { SIGNALING } from './config.js';

export const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // без O/0, I/1
export const CODE_LEN = 5;
export const CONNECT_TIMEOUT = 10000; // вариант А: прямая связь не поднялась за 10 с — понятная ошибка
export const SIGNALING_TIMEOUT = 30000; // сервер комнат на бесплатном хостинге просыпается до ~минуты; переопределяется cfg.signalingTimeout
export const HB_EVERY = 2000;
export const HB_DEAD = 7000;
const PREFIX = 'sharotank-';

export const ERR = {
  SERVER: 'server',     // сервер комнат недоступен
  NO_ROOM: 'no-room',   // комнаты с таким кодом нет
  TIMEOUT: 'timeout',   // прямое соединение не поднялось за 10 с
  FULL: 'full',         // в комнате уже есть второй игрок
  BAD_CODE: 'bad-code'  // код введён неверно (длина / символы)
};

export function makeCode(rnd = Math.random) {
  let s = '';
  for (let i = 0; i < CODE_LEN; i++) s += ALPHABET[Math.floor(rnd() * ALPHABET.length)];
  return s;
}
/** Приводит ввод друга к коду: регистр, пробелы, похожие символы (O→0 не бывает, поэтому O/I/0/1 просто отбрасываем). */
export function normalizeCode(s) {
  const c = String(s || '').toUpperCase().replace(/[\s-]+/g, '');
  return c.length === CODE_LEN && [...c].every(ch => ALPHABET.includes(ch)) ? c : null;
}

function netCfg() {
  const cfg = { ...(SIGNALING.host ? SIGNALING : {}), ...(typeof window !== 'undefined' && window.SHT_NET_CFG ? window.SHT_NET_CFG : {}) };
  try {
    const sig = new URLSearchParams(location.search).get('sig');
    if (sig) { const [h, p] = sig.split(':'); Object.assign(cfg, { host: h, port: +p || 9000, path: '/', secure: false }); }
  } catch (e) { /* нет location — не страшно */ }
  return cfg;
}
const sigTimeout = () => netCfg().signalingTimeout || SIGNALING_TIMEOUT;

function peerOptions() {
  const cfg = netCfg();
  const o = { debug: 0 }; // PeerJS сам пишет в console.error — ошибки отдаём через свои колбэки
  for (const k of ['host', 'port', 'path', 'secure', 'key']) if (cfg[k] !== undefined) o[k] = cfg[k];
  if (cfg.iceServers) o.config = { iceServers: cfg.iceServers };
  return o;
}

const fail = (code, msg) => Object.assign(new Error(msg || code), { code });

export function createTransport() {
  let peer = null, conn = null, closed = false, opened = false, hosting = false;
  let lastRx = 0, hbTimer = 0;
  const msgCbs = [], closeCbs = [], peerCbs = [];

  const fireClose = reason => {
    if (closed) return;
    const wasOpen = opened;
    opened = false; clearInterval(hbTimer);
    const c = conn; conn = null;
    try { c && c.close(); } catch (e) { /* уже закрыт */ }
    // Хост: уход гостя не закрывает комнату — код остаётся жив, можно позвать другого (или того же).
    if (hosting && reason !== 'local' && reason !== 'fatal') { if (wasOpen) for (const cb of closeCbs) cb(reason); return; }
    closed = true;
    try { peer && peer.destroy(); } catch (e) { /* уже закрыт */ }
    if (wasOpen || reason === 'fatal') for (const cb of closeCbs) cb(reason);
  };

  function wire(c) {
    conn = c;
    c.on('data', d => {
      lastRx = performance.now();
      if (d && d.__hb) return;
      for (const cb of msgCbs) cb(d);
    });
    c.on('close', () => { if (conn === c) fireClose('closed'); });
    c.on('error', () => { if (conn === c) fireClose('error'); });
  }
  function startHeartbeat() {
    lastRx = performance.now();
    hbTimer = setInterval(() => {
      if (!opened) return;
      try { conn.send({ __hb: 1 }); } catch (e) { /* закроется по таймеру ниже */ }
      if (performance.now() - lastRx > HB_DEAD) fireClose('timeout');
    }, HB_EVERY);
  }

  const t = {
    get open() { return opened; },
    get code() { return t._code || null; },

    /** Хост: регистрируем комнату. Возвращает код. Один гость; второй получит ERR.FULL. */
    host() {
      return new Promise((resolve, reject) => {
        let tries = 0;
        const attempt = () => {
          const code = makeCode();
          let p;
          try { p = new Peer(PREFIX + code, peerOptions()); } catch (e) { return reject(fail(ERR.SERVER, String(e))); }
          peer = p;
          const to = setTimeout(() => { try { p.destroy(); } catch (e) { /* ок */ } reject(fail(ERR.SERVER, 'signaling timeout')); }, sigTimeout());
          p.on('open', () => { clearTimeout(to); t._code = code; hosting = true; resolve(code); });
          p.on('error', e => {
            clearTimeout(to);
            if (e.type === 'unavailable-id' && ++tries < 5) { try { p.destroy(); } catch (x) { /* ок */ } return attempt(); } // код занят — берём другой
            if (!t._code) reject(fail(ERR.SERVER, e.type)); else fireClose('fatal');
          });
          p.on('disconnected', () => { if (!t._code) return; try { p.reconnect(); } catch (e) { /* соединение с гостем живёт без сервера */ } });
          p.on('connection', c => {
            if (conn || closed) { // уже есть гость
              c.on('open', () => { try { c.send({ __full: 1 }); } catch (e) { /* ок */ } setTimeout(() => c.close(), 300); });
              return;
            }
            wire(c);
            c.on('open', () => { opened = true; startHeartbeat(); for (const cb of peerCbs) cb(); });
          });
        };
        attempt();
      });
    },

    /** Гость: подключиться по коду. Отклоняется с .code из ERR. */
    join(rawCode) {
      const code = normalizeCode(rawCode);
      if (!code) return Promise.reject(fail(ERR.BAD_CODE));
      return new Promise((resolve, reject) => {
        let settled = false, signalingUp = false; void signalingUp;
        const done = (err) => {
          if (settled) return; settled = true; clearTimeout(to);
          if (err) { try { peer && peer.destroy(); } catch (e) { /* ок */ } closed = true; reject(err); } else resolve();
        };
        // Если сервер сигналинга так и не ответил — это «сервер недоступен», а не «прямая связь не поднялась».
        let to = setTimeout(() => done(fail(ERR.SERVER, 'signaling timeout')), sigTimeout()); // фаза 1: ждём сервер комнат
        try { peer = new Peer(peerOptions()); } catch (e) { return done(fail(ERR.SERVER, String(e))); }
        peer.on('error', e => {
          if (!settled) return done(fail(e.type === 'peer-unavailable' ? ERR.NO_ROOM : ERR.SERVER, e.type));
          fireClose('error');
        });
        peer.on('open', () => {
          signalingUp = true; clearTimeout(to);
          to = setTimeout(() => done(fail(ERR.TIMEOUT, 'p2p timeout')), CONNECT_TIMEOUT); // фаза 2: прямая связь с хостом
          const c = peer.connect(PREFIX + code, { serialization: 'json', reliable: true });
          wire(c);
          c.on('data', d => { if (d && d.__full && !settled) { done(fail(ERR.FULL)); } });
          c.on('open', () => { opened = true; t._code = code; startHeartbeat(); done(null); });
        });
      });
    },

    send(msg) { if (opened) { try { conn.send(msg); } catch (e) { fireClose('error'); } } },
    onMessage(cb) { msgCbs.push(cb); },
    onClose(cb) { closeCbs.push(cb); },
    /** Хост: гость подключился (канал открыт). */
    onPeer(cb) { peerCbs.push(cb); },
    close() { fireClose('local'); }
  };
  return t;
}
