#!/usr/bin/env bash
# Боевой деплой artem → https://vibespace27.ru
# (/var/www/vibespace → symlink на релиз, PM2 :3001)
#
# Из корня репо на Mac:
#   chmod +x deploy.sh scripts/remote-setup.sh
#   ./deploy.sh
#
# Поведение по умолчанию (безопасно):
#   - живой каталог не wipe'ится
#   - БД не дропается; migrate только накатывает новые миграции
#   - seed только если site_settings пустой
#   - PM2 переключается после health-check на временном порту
#   - при ошибке старый процесс остаётся
#
# Опции:
#   DEPLOY_HOST=root@147.45.161.75
#   DEPLOY_PATH=/var/www/vibespace          # symlink «текущий»
#   DEPLOY_RELEASES=/var/www/vibespace-releases
#   DEPLOY_SHARED=/var/www/vibespace-shared # uploads и пр.
#   DEPLOY_PORT=3001
#   DEPLOY_PROBE_PORT=3011                  # временный порт для проверки
#   DEPLOY_SITE_URL=https://vibespace27.ru
#   SKIP_BUILD=1
#   REMOTE_BUILD=1
#   FORCE_NPM_CI=1                          # принудительно npm ci (локально и на сервере)
#   RESET_DB=1                              # ЯВНО снести и пересоздать БД (опасно)
#   FORCE_SEED=1                            # принудительный seed (onConflictDoNothing)
#   KEEP_RELEASES=3
#
# Секреты: /root/.config/artem-vibespace.env

set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

HOST="${DEPLOY_HOST:-root@147.45.161.75}"
LIVE_LINK="${DEPLOY_PATH:-/var/www/vibespace}"
RELEASES_ROOT="${DEPLOY_RELEASES:-/var/www/vibespace-releases}"
SHARED_ROOT="${DEPLOY_SHARED:-/var/www/vibespace-shared}"
APP_PORT="${DEPLOY_PORT:-3001}"
PROBE_PORT="${DEPLOY_PROBE_PORT:-3011}"
SITE_URL="${DEPLOY_SITE_URL:-https://vibespace27.ru}"
NODE_VERSION="${DEPLOY_NODE_VERSION:-22}"
PM2_NAME="${DEPLOY_PM2_NAME:-vibespace}"
ENV_STORE="/root/.config/artem-vibespace.env"
KEEP_RELEASES="${KEEP_RELEASES:-3}"
RELEASE_ID="$(date -u +%Y%m%d-%H%M%S)"
RELEASE_DIR="${RELEASES_ROOT}/${RELEASE_ID}"

ensure_node_modules() {
  local label="$1"
  if [[ "${FORCE_NPM_CI:-0}" == "1" ]]; then
    echo "==> ${label}: FORCE_NPM_CI=1 → npm ci"
    npm ci
    return
  fi
  if [[ -x node_modules/.bin/next && -d node_modules/next ]]; then
    echo "==> ${label}: node_modules уже есть → skip npm ci"
    return
  fi
  echo "==> ${label}: нет node_modules → npm ci"
  if ! npm ci; then
    echo "WARN: npm ci failed, falling back to npm install"
    npm install
  fi
}

if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

# Всегда продакшен URL в бандл — не localhost из локального .env
export NEXT_PUBLIC_SITE_URL="$SITE_URL"
: "${NEXT_PUBLIC_YANDEX_METRIKA_ID:=}"
: "${NEXT_PUBLIC_YANDEX_MAPS_API_KEY:=}"

echo "==> Host: $HOST"
echo "==> Live: $LIVE_LINK"
echo "==> Release: $RELEASE_DIR"
echo "==> Port: $APP_PORT (probe $PROBE_PORT)  pm2: $PM2_NAME"
echo "==> Site: $SITE_URL"
echo "==> Metrika ID: ${NEXT_PUBLIC_YANDEX_METRIKA_ID:-empty}"
echo "==> RESET_DB=${RESET_DB:-0} FORCE_SEED=${FORCE_SEED:-0} FORCE_NPM_CI=${FORCE_NPM_CI:-0}"

if [[ "${REMOTE_BUILD:-0}" != "1" && "${SKIP_BUILD:-0}" != "1" ]]; then
  echo "==> Local deps + production build (SITE_URL=$SITE_URL)"
  ensure_node_modules "local"
  npm run build
fi

echo "==> Prepare remote release dirs (live process NOT stopped)"
ssh -o ServerAliveInterval=15 -o ServerAliveCountMax=40 -o ConnectTimeout=20 "$HOST" \
  "mkdir -p '${RELEASE_DIR}' '${SHARED_ROOT}/public/media/uploads' '${RELEASES_ROOT}'"

echo "==> Rsync → release (без .next/dev)"
RSYNC_EXCLUDES=(
  --exclude '.git/'
  --exclude 'node_modules/'
  --exclude '.env'
  --exclude '.env.*'
  --exclude '.superpowers/'
  --exclude '.worktrees/'
  --exclude '.cursor/'
  --exclude 'coverage/'
  --exclude 'playwright-report/'
  --exclude 'test-results/'
  --exclude '.DS_Store'
  --exclude '*.log'
  --exclude '.next/cache/'
  --exclude '.next/dev/'
  --exclude 'public/media/uploads/*'
  --exclude '*.jpeg'
  --exclude 'WhatsApp*'
)

if [[ "${REMOTE_BUILD:-0}" == "1" ]]; then
  RSYNC_EXCLUDES+=(--exclude '.next/')
fi

rsync -az --partial --progress --timeout=120 \
  -e "ssh -o ServerAliveInterval=15 -o ServerAliveCountMax=40 -o ConnectTimeout=20" \
  "${RSYNC_EXCLUDES[@]}" \
  --include 'public/media/uploads/.gitkeep' \
  "$ROOT/" "$HOST:$RELEASE_DIR/"

echo "==> Remote setup + health + atomic switch"
ssh -o ServerAliveInterval=15 -o ServerAliveCountMax=40 -o ConnectTimeout=20 "$HOST" \
  env \
  REMOTE_DIR="$RELEASE_DIR" \
  LIVE_LINK="$LIVE_LINK" \
  SHARED_ROOT="$SHARED_ROOT" \
  RELEASES_ROOT="$RELEASES_ROOT" \
  KEEP_RELEASES="$KEEP_RELEASES" \
  APP_PORT="$APP_PORT" \
  PROBE_PORT="$PROBE_PORT" \
  PM2_NAME="$PM2_NAME" \
  NODE_VERSION="$NODE_VERSION" \
  SITE_URL="$SITE_URL" \
  ENV_STORE="$ENV_STORE" \
  METRIKA_ID="${NEXT_PUBLIC_YANDEX_METRIKA_ID}" \
  MAPS_KEY="${NEXT_PUBLIC_YANDEX_MAPS_API_KEY}" \
  REMOTE_BUILD="${REMOTE_BUILD:-0}" \
  RESET_DB="${RESET_DB:-0}" \
  FORCE_SEED="${FORCE_SEED:-0}" \
  FORCE_NPM_CI="${FORCE_NPM_CI:-0}" \
  bash "$RELEASE_DIR/scripts/remote-setup.sh"

echo "==> HTTPS smoke"
HTTP_CODE="$(curl -sS -o /dev/null -w "%{http_code}" "https://vibespace27.ru/" || echo 000)"
echo "https_vibespace27=${HTTP_CODE}"
if [[ "$HTTP_CODE" != "200" && "$HTTP_CODE" != "304" ]]; then
  echo "WARN: HTTPS smoke не 200 — проверь nginx/PM2 вручную" >&2
  exit 1
fi

echo "==> Готово: ${SITE_URL}"
echo "    Админка: ${SITE_URL}/admin/login"
echo "    Релиз: ${RELEASE_DIR}"
echo "    Env: ${ENV_STORE}"
echo "    При первом bootstrap смотри CREATED_ADMIN_PASSWORD=... в выводе выше."
