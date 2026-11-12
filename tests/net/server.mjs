/* Локальный сигнальный сервер для сетевых тестов (вместо PeerJS-облака): хранит только рукопожатия,
   игровых данных не видит. Для тестов: const sig = await startSignaling(); … await sig.close(); */
import net from 'node:net';
import { PeerServer } from 'peer';

function freePort() {
  return new Promise((res, rej) => { const s = net.createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => res(p)); }); s.on('error', rej); });
}

export async function startSignaling() {
  const port = await freePort();
  const server = await new Promise(res => { const app = PeerServer({ port, host: '127.0.0.1', path: '/' }, s => res(s)); void app; });
  return {
    port,
    /** Что подставить в window.SHT_NET_CFG на странице. iceServers пустой: в тестах всё на localhost, STUN не нужен. */
    cfg: { host: '127.0.0.1', port, path: '/', secure: false, iceServers: [] },
    close: () => new Promise(res => { server.close(() => res()); server.closeAllConnections?.(); setTimeout(res, 500); })
  };
}

/** «Зависший» сервер: принимает соединения и молчит — проверка таймаута 10 с и текста ошибки. */
export async function startDeafServer() {
  const port = await freePort(), socks = new Set();
  const s = net.createServer(sock => { socks.add(sock); sock.on('close', () => socks.delete(sock)); sock.on('error', () => {}); });
  await new Promise(res => s.listen(port, '127.0.0.1', res));
  return { port, cfg: { host: '127.0.0.1', port, path: '/', secure: false, iceServers: [] }, close: () => { for (const k of socks) k.destroy(); s.close(); } };
}
