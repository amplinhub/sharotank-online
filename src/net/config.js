/* Адрес сервера комнат (сигналинга). Пока host пустой — используется публичное облако PeerJS (0.peerjs.com),
   а оно в части сетей заблокировано. Поднимите свой сервер (папка server/, инструкция в server/README.md)
   и впишите сюда его адрес — тогда игра ходит только к нему. */
export const SIGNALING = {
  host: 'sharotank-signaling.onrender.com',  // Render (бесплатно, засыпает); потом заменить на свой VPS
  port: 443,
  secure: true,    // wss — обязательно, раз игра открывается с https (GitHub Pages)
  path: '/'
};
