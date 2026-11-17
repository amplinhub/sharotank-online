/* Отдаёт транспорт игре. Игровой код (src/game/*) пока одна общая область видимости без import,
   поэтому берёт его из window.SHT_NET. Импортируется в main.js раньше игры. */
import { createTransport, ERR, normalizeCode } from './transport.js';
import { sheetsCall, sheetsUrl } from './sheets.js';
window.SHT_NET = { createTransport, ERR, normalizeCode };
window.SHT_SHEETS = { call: sheetsCall, url: sheetsUrl };
