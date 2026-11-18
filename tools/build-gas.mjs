/* Собирает server/sheets/Code.gs (вставляется в Apps Script целиком) из core.js + gas.js. */
import fs from 'node:fs';
const d = new URL('../server/sheets/', import.meta.url).pathname;
const out = '/* Шаротанк Онлайн — сервер «Онлайн рейтинга» для Google Таблиц. Файл собран tools/build-gas.mjs из core.js + gas.js — правьте их. */\n\n'
  + fs.readFileSync(d + 'filter.js', 'utf8') + '\n' + fs.readFileSync(d + 'core.js', 'utf8') + '\n' + fs.readFileSync(d + 'gas.js', 'utf8');
fs.writeFileSync(d + 'Code.gs', out); console.log('server/sheets/Code.gs', out.length, 'bytes');
