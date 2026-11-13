#!/usr/bin/env bash
# Установка сервера комнат Шаротанк Онлайн на чистый Ubuntu/Debian одной командой.
#   bash install.sh                  — домен сам: <IP-через-дефисы>.sslip.io
#   bash install.sh tank.example.com — свой домен (запись A должна указывать на IP сервера)
# Можно запускать и так (без клонирования вручную):
#   curl -fsSL https://raw.githubusercontent.com/amplinhub/sharotank-online/main/server/install.sh | bash
set -euo pipefail

REPO="${REPO:-https://github.com/amplinhub/sharotank-online}"
DIR="${DIR:-/opt/sharotank-online}"
DOMAIN="${1:-${DOMAIN:-}}"

say() { printf '\n\033[1;32m==> %s\033[0m\n' "$*"; }
die() { printf '\n\033[1;31mОшибка: %s\033[0m\n' "$*" >&2; exit 1; }

[ "$(id -u)" -eq 0 ] || die "запусти от root (ssh root@IP) или через sudo."
command -v apt-get >/dev/null || die "скрипт рассчитан на Ubuntu/Debian."

say "1/5 Базовые пакеты"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq curl git ca-certificates >/dev/null

say "2/5 Docker"
if command -v docker >/dev/null && docker compose version >/dev/null 2>&1; then
  echo "Docker уже установлен."
else
  curl -fsSL https://get.docker.com | sh
fi
systemctl enable --now docker >/dev/null 2>&1 || true

say "3/5 Код сервера"
SRC="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" 2>/dev/null && pwd || true)"
if [ -n "$SRC" ] && [ -f "$SRC/docker-compose.yml" ] && [ -f "$SRC/server.mjs" ]; then
  SERVER_DIR="$SRC"                      # запущен из клона репозитория
else
  if [ -d "$DIR/.git" ]; then git -C "$DIR" pull --ff-only; else git clone "$REPO" "$DIR"; fi
  SERVER_DIR="$DIR/server"
fi
echo "Папка: $SERVER_DIR"

say "4/5 Адрес (домен)"
IP=""
for u in https://api.ipify.org https://ifconfig.me https://icanhazip.com; do
  IP="$(curl -4 -fsS --max-time 8 "$u" 2>/dev/null | tr -d '[:space:]' || true)"
  [[ "$IP" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]] && break || IP=""
done
if [ -z "$DOMAIN" ]; then
  [ -n "$IP" ] || die "не смог узнать внешний IP. Запусти с доменом: bash install.sh tank.example.com"
  DOMAIN="${IP//./-}.sslip.io"
  echo "Свой домен не указан — беру бесплатный: $DOMAIN"
  echo "(sslip.io сам отвечает адресом из названия. Если не откроется у игроков — купи домен и запусти: bash install.sh твой.домен)"
fi
RES="$(getent ahostsv4 "$DOMAIN" 2>/dev/null | awk 'NR==1{print $1}' || true)"
if [ -z "$RES" ]; then
  echo "ВНИМАНИЕ: имя $DOMAIN пока не резолвится. Сертификат не выпустится, пока запись A не появится."
elif [ -n "$IP" ] && [ "$RES" != "$IP" ]; then
  echo "ВНИМАНИЕ: $DOMAIN указывает на $RES, а IP сервера $IP. Поправь запись A."
fi

# Порты 80/443 нужны для сертификата и работы. Открываем в ufw, если он включён.
if command -v ufw >/dev/null && ufw status 2>/dev/null | grep -q "Status: active"; then
  ufw allow 80/tcp >/dev/null; ufw allow 443/tcp >/dev/null; ufw allow 443/udp >/dev/null
  echo "ufw: порты 80 и 443 открыты."
fi

say "5/5 Запуск"
cd "$SERVER_DIR"
echo "DOMAIN=$DOMAIN" > .env
docker compose up -d --build

echo "Жду выпуска сертификата (до 2 минут)…"
OK=0
for _ in $(seq 1 24); do
  if curl -fsS --max-time 8 "https://$DOMAIN/" >/dev/null 2>&1; then OK=1; break; fi
  sleep 5
done

if [ "$OK" -eq 1 ]; then
  printf '\n\033[1;32mГОТОВО. Сервер комнат работает: https://%s/\033[0m\n' "$DOMAIN"
  echo "Открой этот адрес в браузере телефона (Wi-Fi и мобильный интернет): должен показаться короткий JSON."
  echo "Пришли мне в чат адрес:  $DOMAIN"
else
  printf '\n\033[1;33mСервер запущен, но https://%s/ пока не отвечает.\033[0m\n' "$DOMAIN"
  echo "Что проверить:"
  echo "  1) порты 80 и 443 открыты в панели/файрволе провайдера;"
  echo "  2) логи сертификата:  cd $SERVER_DIR && docker compose logs caddy | tail -30"
  echo "  3) 'too many certificates' в логах = у sslip.io общий лимит Let's Encrypt; подожди или возьми свой домен."
  exit 2
fi
