#!/usr/bin/env bash
# Remote setup for a single release directory (called by deploy.sh via SSH).
# Не останавливает текущий PM2, пока probe health не пройден.
set -euo pipefail

REMOTE_DIR="${REMOTE_DIR:?}"
LIVE_LINK="${LIVE_LINK:?}"
SHARED_ROOT="${SHARED_ROOT:?}"
RELEASES_ROOT="${RELEASES_ROOT:?}"
KEEP_RELEASES="${KEEP_RELEASES:-1}"
APP_PORT="${APP_PORT:?}"
PROBE_PORT="${PROBE_PORT:-3011}"
PM2_NAME="${PM2_NAME:?}"
NODE_VERSION="${NODE_VERSION:?}"
SITE_URL="${SITE_URL:?}"
ENV_STORE="${ENV_STORE:?}"
METRIKA_ID="${METRIKA_ID:-}"
MAPS_KEY="${MAPS_KEY:-}"
REMOTE_BUILD="${REMOTE_BUILD:-0}"
RESET_DB="${RESET_DB:-0}"
FORCE_SEED="${FORCE_SEED:-0}"
FORCE_NPM_CI="${FORCE_NPM_CI:-0}"

export NVM_DIR="${HOME}/.nvm"
# shellcheck disable=SC1091
[ -s "${NVM_DIR}/nvm.sh" ] && . "${NVM_DIR}/nvm.sh"
nvm install "${NODE_VERSION}" >/dev/null
nvm use "${NODE_VERSION}"
hash -r

if ! command -v pm2 >/dev/null 2>&1; then
  npm install -g pm2 >/dev/null
  hash -r
fi

mkdir -p \
  "$(dirname "${ENV_STORE}")" \
  "${SHARED_ROOT}/public/media/uploads" \
  "${REMOTE_DIR}/public/media"

# Shared uploads: не теряем медиа между релизами.
# Симлинк ставим ПОСЛЕ build — Turbopack падает на symlink наружу из корня проекта.
if [[ -d "${LIVE_LINK}/public/media/uploads" && ! -L "${LIVE_LINK}/public/media/uploads" ]]; then
  # разовый перенос со старого live-дерева
  cp -a "${LIVE_LINK}/public/media/uploads/." "${SHARED_ROOT}/public/media/uploads/" 2>/dev/null || true
fi
mkdir -p "${REMOTE_DIR}/public/media/uploads"

if [[ ! -f "${ENV_STORE}" ]]; then
  DB_PASS="$(openssl rand -base64 24 | tr -d '/+=' | head -c 24)"
  SESSION_SECRET="$(openssl rand -base64 48 | tr -d '\n')"
  ADMIN_PASSWORD="$(openssl rand -base64 18 | tr -d '/+=' | head -c 18)"
  DB_PASS_URLENC="$(python3 -c "import urllib.parse,sys; print(urllib.parse.quote(sys.argv[1], safe=''))" "${DB_PASS}")"
  ADMIN_PASSWORD_ENV="${ADMIN_PASSWORD//$/\\$}"

  umask 077
  cat > "${ENV_STORE}" <<ENV
DATABASE_URL=postgresql://artem:${DB_PASS_URLENC}@127.0.0.1:5432/artem
SESSION_SECRET=${SESSION_SECRET}
TRUSTED_PROXY_HOPS=1
ADMIN_EMAIL=admin@vibespace27.ru
ADMIN_PASSWORD=${ADMIN_PASSWORD_ENV}
MEDIA_DRIVER=local
NEXT_PUBLIC_SITE_URL=${SITE_URL}
NEXT_PUBLIC_YANDEX_METRIKA_ID=${METRIKA_ID}
NEXT_PUBLIC_YANDEX_MAPS_API_KEY=${MAPS_KEY}
NEXT_PUBLIC_ALLOW_INDEXING=${ALLOW_INDEXING:-false}
ENV
  echo "CREATED_ADMIN_EMAIL=admin@vibespace27.ru"
  echo "CREATED_ADMIN_PASSWORD=${ADMIN_PASSWORD}"
  FORCE_SEED=1
else
  python3 - <<'PY'
import os
from pathlib import Path

path = Path(os.environ["ENV_STORE"])
site = os.environ["SITE_URL"]
metrika = os.environ.get("METRIKA_ID", "")
maps = os.environ.get("MAPS_KEY", "")
allow_indexing = os.environ.get("ALLOW_INDEXING", "false")
lines = [
    line
    for line in path.read_text().splitlines()
    if not line.startswith(
        (
            "NEXT_PUBLIC_SITE_URL=",
            "NEXT_PUBLIC_YANDEX_METRIKA_ID=",
            "NEXT_PUBLIC_YANDEX_MAPS_API_KEY=",
            "NEXT_PUBLIC_ALLOW_INDEXING=",
        )
    )
]
lines.extend(
    [
        f"NEXT_PUBLIC_SITE_URL={site}",
        f"NEXT_PUBLIC_YANDEX_METRIKA_ID={metrika}",
        f"NEXT_PUBLIC_YANDEX_MAPS_API_KEY={maps}",
        f"NEXT_PUBLIC_ALLOW_INDEXING={allow_indexing}",
    ]
)
path.write_text("\n".join(lines) + "\n")
print("REUSED_EXISTING_ENV_STORE")
PY
fi

# Timeweb: DNS api.telegram.org часто мёртвый — форсим живой DC в ENV_STORE
python3 - <<'PY'
import os
from pathlib import Path

path = Path(os.environ["ENV_STORE"])
fallback = "149.154.167.220"
lines = path.read_text().splitlines()
keys = ("TELEGRAM_API_IP=", "TELEGRAM_API_IPS=", "TELEGRAM_API_BASE=")
has_override = any(line.startswith(keys) and line.split("=", 1)[1].strip() for line in lines)
if not has_override:
    lines = [line for line in lines if not line.startswith("TELEGRAM_API_IP=")]
    lines.append(f"TELEGRAM_API_IP={fallback}")
    path.write_text("\n".join(lines) + "\n")
    print(f"ENSURED_TELEGRAM_API_IP={fallback}")
else:
    print("TELEGRAM_API_OVERRIDE_PRESENT")
PY

cp "${ENV_STORE}" "${REMOTE_DIR}/.env"
chmod 600 "${REMOTE_DIR}/.env"

# --- DB: ensure exists; DROP only if RESET_DB=1 ---
python3 - <<'PY'
import os
import subprocess
from urllib.parse import unquote, urlparse

url = None
for line in open(os.environ["ENV_STORE"], encoding="utf-8"):
    if line.startswith("DATABASE_URL="):
        url = line.split("=", 1)[1].strip()
        break
if not url:
    raise SystemExit("DATABASE_URL missing")

parsed = urlparse(url)
user = unquote(parsed.username or "")
password = unquote(parsed.password or "")
db = (parsed.path or "/artem").lstrip("/") or "artem"
pw = password.replace("'", "''")
reset = os.environ.get("RESET_DB", "0") == "1"

def psql(sql: str) -> None:
    subprocess.run(
        ["sudo", "-u", "postgres", "psql", "-v", "ON_ERROR_STOP=1", "-c", sql],
        check=True,
    )

def psql_scalar(sql: str) -> str:
    out = subprocess.check_output(
        ["sudo", "-u", "postgres", "psql", "-At", "-c", sql],
        text=True,
    )
    return out.strip()

psql(
    f"""
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '{user}') THEN
    CREATE ROLE {user} LOGIN PASSWORD '{pw}';
  ELSE
    ALTER ROLE {user} WITH LOGIN PASSWORD '{pw}';
  END IF;
END
$$;
"""
)

if reset:
    psql(
        f"""
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = '{db}' AND pid <> pg_backend_pid();
"""
    )
    psql(f"DROP DATABASE IF EXISTS {db};")
    psql("DROP DATABASE IF EXISTS vibespace;")
    psql(f"CREATE DATABASE {db} OWNER {user};")
    print(f"DB_RESET={db}")
    open("/tmp/artem-need-seed", "w").write("1")
else:
    exists = psql_scalar(f"SELECT 1 FROM pg_database WHERE datname = '{db}'")
    if exists != "1":
        psql(f"CREATE DATABASE {db} OWNER {user};")
        print(f"DB_CREATED={db}")
        open("/tmp/artem-need-seed", "w").write("1")
    else:
        print(f"DB_KEPT={db}")
        if os.path.exists("/tmp/artem-need-seed"):
            os.remove("/tmp/artem-need-seed")
PY

cd "${REMOTE_DIR}"

# deps: переиспользовать node_modules с live (тот же lockfile) или npm ci
install_release_deps() {
  local live_resolved=""
  if [[ -L "${LIVE_LINK}" || -d "${LIVE_LINK}" ]]; then
    live_resolved="$(readlink -f "${LIVE_LINK}" 2>/dev/null || true)"
  fi

  if [[ "${FORCE_NPM_CI}" == "1" ]]; then
    echo "==> remote: FORCE_NPM_CI=1 → npm ci"
    if ! npm ci; then
      echo "WARN: npm ci failed, falling back to npm install"
      rm -rf node_modules
      npm install
    fi
    return
  fi

  if [[ -n "${live_resolved}" \
    && -d "${live_resolved}/node_modules/next" \
    && -f "${live_resolved}/package-lock.json" \
    && -f package-lock.json ]] \
    && cmp -s package-lock.json "${live_resolved}/package-lock.json"; then
    echo "==> remote: копирую node_modules с live (lockfile совпал)"
    rm -rf node_modules
    # hardlink-копия на том же FS — быстро; fallback на обычный cp
    if ! cp -al "${live_resolved}/node_modules" node_modules 2>/dev/null; then
      cp -a "${live_resolved}/node_modules" node_modules
    fi
    return
  fi

  if [[ -x node_modules/.bin/next && -d node_modules/next ]]; then
    echo "==> remote: node_modules уже в релизе → skip npm ci"
    return
  fi

  echo "==> remote: npm ci"
  if ! npm ci; then
    echo "WARN: npm ci failed, falling back to npm install"
    rm -rf node_modules
    npm install
  fi
}

install_release_deps

if [[ "${REMOTE_BUILD}" == "1" ]]; then
  export NODE_OPTIONS="--max-old-space-size=768"
  npm run build
fi

if [[ ! -d .next ]]; then
  echo "ERROR: .next отсутствует в релизе — сборка не попала на сервер" >&2
  exit 1
fi

rm -rf "${REMOTE_DIR}/public/media/uploads"
ln -sfn "${SHARED_ROOT}/public/media/uploads" "${REMOTE_DIR}/public/media/uploads"

echo "==> db:migrate (только pending)"
npm run db:migrate

NEED_SEED=0
if [[ "${FORCE_SEED}" == "1" || -f /tmp/artem-need-seed ]]; then
  NEED_SEED=1
fi
# Авто-seed если нет строки settings
if [[ "${NEED_SEED}" != "1" ]]; then
  set -a
  # shellcheck disable=SC1091
  . "${REMOTE_DIR}/.env"
  set +a
  COUNT="$(sudo -u postgres psql -At -d artem -c "SELECT count(*) FROM site_settings;" 2>/dev/null || echo 0)"
  if [[ "${COUNT}" == "0" ]]; then
    NEED_SEED=1
  fi
fi

if [[ "${NEED_SEED}" == "1" ]]; then
  echo "==> db:seed (bootstrap / FORCE_SEED)"
  npm run db:seed
else
  echo "==> db:seed skipped (данные уже есть)"
fi

NODE_BIN="$(nvm which "${NODE_VERSION}")"
set -a
# shellcheck disable=SC1090
. "${REMOTE_DIR}/.env"
set +a

# PM2 подхватывает ecosystem только из файлов ecosystem.config.*
# (ecosystem.probe.cjs стартует как пустой script — порт не слушается).
write_ecosystem() {
  local name="$1"
  local port="$2"
  local out="$3"
  python3 - <<PY
from pathlib import Path
import json
import os

def pick(*keys: str, default: str | None = None) -> str | None:
    for key in keys:
        value = os.environ.get(key)
        if value is not None and value != "":
            return value
    return default

env = {
    "NODE_ENV": "production",
    "PORT": "${port}",
    "HOSTNAME": "127.0.0.1",
    "DATABASE_URL": os.environ.get("DATABASE_URL", ""),
    "SESSION_SECRET": os.environ.get("SESSION_SECRET", ""),
    "TRUSTED_PROXY_HOPS": os.environ.get("TRUSTED_PROXY_HOPS") or "1",
    "MEDIA_DRIVER": os.environ.get("MEDIA_DRIVER") or "local",
    "ADMIN_EMAIL": os.environ.get("ADMIN_EMAIL", ""),
    "ADMIN_PASSWORD": os.environ.get("ADMIN_PASSWORD", ""),
    "NEXT_PUBLIC_SITE_URL": os.environ.get("NEXT_PUBLIC_SITE_URL") or "${SITE_URL}",
    "NEXT_PUBLIC_YANDEX_METRIKA_ID": os.environ.get("NEXT_PUBLIC_YANDEX_METRIKA_ID") or "",
    "NEXT_PUBLIC_YANDEX_MAPS_API_KEY": os.environ.get("NEXT_PUBLIC_YANDEX_MAPS_API_KEY") or "",
    "NEXT_PUBLIC_ALLOW_INDEXING": os.environ.get("NEXT_PUBLIC_ALLOW_INDEXING") or "false",
}
# Не кладём пустые TELEGRAM_* — иначе PM2 "" перебьёт значения из .env
for key, value in {
    "TELEGRAM_BOT_TOKEN": pick("TELEGRAM_BOT_TOKEN"),
    "TELEGRAM_CHAT_ID": pick("TELEGRAM_CHAT_ID"),
    "TELEGRAM_API_IP": pick("TELEGRAM_API_IP", default="149.154.167.220"),
    "TELEGRAM_API_IPS": pick("TELEGRAM_API_IPS"),
    "TELEGRAM_API_BASE": pick("TELEGRAM_API_BASE"),
}.items():
    if value is not None:
        env[key] = value

cfg = {
    "apps": [
        {
            "name": "${name}",
            "cwd": "${REMOTE_DIR}",
            "script": "node_modules/next/dist/bin/next",
            "args": "start -p ${port} -H 127.0.0.1",
            "interpreter": "${NODE_BIN}",
            "env": env,
        }
    ]
}
Path("${out}").write_text(
    "module.exports = " + json.dumps(cfg, ensure_ascii=False, indent=2) + ";\n"
)
print(f"WROTE_ECOSYSTEM name={cfg['apps'][0]['name']} port=${port} -> ${out}")
PY
}

PROBE_NAME="${PM2_NAME}-probe"
PROBE_DIR="${REMOTE_DIR}/.pm2-probe"
mkdir -p "${PROBE_DIR}"
PROBE_ECO="${PROBE_DIR}/ecosystem.config.cjs"
write_ecosystem "${PROBE_NAME}" "${PROBE_PORT}" "${PROBE_ECO}"

echo "==> Probe start on :${PROBE_PORT} (live :${APP_PORT} still running)"
pm2 delete "${PROBE_NAME}" 2>/dev/null || true
pm2 delete ecosystem.probe 2>/dev/null || true
pm2 start "${PROBE_ECO}"

ok=0
code="000"
for _ in $(seq 1 45); do
  code="$(curl -sS -o /dev/null -w "%{http_code}" "http://127.0.0.1:${PROBE_PORT}/" 2>/dev/null || true)"
  if [[ -z "${code}" ]]; then
    code="000"
  fi
  if [[ "${code}" == "200" ]]; then
    ok=1
    break
  fi
  sleep 1
done

if [[ "${ok}" != "1" ]]; then
  echo "ERROR: probe health failed (last http=${code}) — live PM2 не трогаем" >&2
  pm2 describe "${PROBE_NAME}" 2>/dev/null | head -30 || true
  pm2 logs "${PROBE_NAME}" --lines 50 --nostream || true
  pm2 delete "${PROBE_NAME}" 2>/dev/null || true
  exit 1
fi
echo "probe_http=200"

# Atomic switch: symlink + replace PM2 app on real port
LIVE_ECO="${REMOTE_DIR}/ecosystem.config.cjs"
write_ecosystem "${PM2_NAME}" "${APP_PORT}" "${LIVE_ECO}"

# Если LIVE_LINK — обычный каталог (старый деплой), переименуем в backup один раз
if [[ -e "${LIVE_LINK}" && ! -L "${LIVE_LINK}" ]]; then
  BACKUP_OLD="${RELEASES_ROOT}/pre-symlink-backup-$(date -u +%Y%m%d-%H%M%S)"
  echo "==> Move old live tree → ${BACKUP_OLD}"
  mv "${LIVE_LINK}" "${BACKUP_OLD}"
fi

ln -sfn "${REMOTE_DIR}" "${LIVE_LINK}"
echo "LIVE_SYMLINK=${LIVE_LINK} → ${REMOTE_DIR}"

echo "==> Switch PM2 ${PM2_NAME} → new release :${APP_PORT}"
pm2 delete "${PROBE_NAME}" 2>/dev/null || true
pm2 delete "${PM2_NAME}" 2>/dev/null || true
pm2 start "${LIVE_ECO}"
pm2 save

live_ok=0
for _ in $(seq 1 20); do
  code="$(curl -sS -o /dev/null -w "%{http_code}" "http://127.0.0.1:${APP_PORT}/" || echo 000)"
  if [[ "${code}" == "200" ]]; then
    live_ok=1
    break
  fi
  sleep 1
done

if [[ "${live_ok}" != "1" ]]; then
  echo "ERROR: live port health failed after switch (http=${code:-000})" >&2
  pm2 logs "${PM2_NAME}" --lines 40 --nostream || true
  exit 1
fi
echo "local_http=200"

# KEEP_RELEASES = сколько каталогов оставить, включая текущий.
# 1 = только live (старый удаляется после health-check). 2 = live + 1 предыдущий.
python3 - <<PY
import os
import shutil
from pathlib import Path

root = Path(os.environ["RELEASES_ROOT"])
keep = max(1, int(os.environ.get("KEEP_RELEASES", "1")))
current = Path(os.environ["REMOTE_DIR"]).resolve()
releases = sorted(
    [p for p in root.iterdir() if p.is_dir() and not p.name.startswith("pre-symlink")],
    key=lambda p: p.name,
)
others = [p for p in releases if p.resolve() != current]
keep_others = keep - 1
to_drop = others if keep_others <= 0 else others[:-keep_others]
for p in root.iterdir():
    if p.is_dir() and p.name.startswith("pre-symlink"):
        to_drop.append(p)
for p in to_drop:
    print(f"PRUNE_RELEASE={p}")
    shutil.rmtree(p, ignore_errors=True)
PY

echo "DEPLOY_OK release=${REMOTE_DIR}"
