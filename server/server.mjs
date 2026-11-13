/* Сервер комнат для Шаротанк Онлайн (PeerServer). Через него игроки лишь находят друг друга,
   дальше данные идут напрямую между браузерами (WebRTC). Порт берётся из PORT (хостинг его задаёт сам). */
import { PeerServer } from 'peer';

const port = Number(process.env.PORT) || 9000;
PeerServer({
  port,
  host: process.env.HOST || '0.0.0.0', // IPv4: PeerServer по умолчанию слушает '::', а где нет IPv6 — падает
  path: '/',
  proxied: true,                 // за прокси хостинга (https/wss снаружи)
  allow_discovery: false,        // список игроков не отдаём
  concurrent_limit: 200,
  alive_timeout: 60000,
  corsOptions: { origin: true }  // игра открывается с github.io или с файла
}, () => console.log(`sharotank signaling on :${port}`));
