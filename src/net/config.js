/* Адрес сервера комнат (сигналинга). Пока host пустой — используется публичное облако PeerJS (0.peerjs.com),
   а оно в части сетей заблокировано. Поднимите свой сервер (папка server/, инструкция в server/README.md)
   и впишите сюда его адрес — тогда игра ходит только к нему. */
export const SIGNALING = {
  host: 'sharotank-signaling.onrender.com',  // Render (бесплатно, засыпает); потом заменить на свой VPS
  port: 443,
  secure: true,    // wss — обязательно, раз игра открывается с https (GitHub Pages)
  path: '/'
};

/* Сервер «Водителей» (рекорды, вызовы, посылки) — веб-приложение Apps Script при таблице «Шаротанк Онлайн — Водители».
   Вставьте сюда адрес …/exec после развёртывания (server/sheets/README.md). Пусто — меню «Водители» скажет, что сервер не подключён.
   Переопределение: ?sheets=<адрес> или window.SHT_NET_CFG.sheets ('off' — выключить, так делают автотесты). */
export const SHEETS = {
  url: 'https://script.google.com/macros/s/AKfycbzkplj1B7Z-k-cM30tiZFo9UV1eMf3agIMNZKwGvNq-knWfkWxF0zkc-esF_9Xhqf-F/exec'
};
