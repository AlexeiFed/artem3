#!/usr/bin/env bash
# Ensure nginx:
# 1) allows large media uploads (client_max_body_size)
# 2) serves /media/uploads/ from shared storage (Next caches public/ at boot)
# Safe to re-run. Requires root on the app host.
set -euo pipefail

LIMIT="${NGINX_CLIENT_MAX_BODY_SIZE:-105m}"
SNIPPET_DIR="${NGINX_SNIPPET_DIR:-/etc/nginx/conf.d}"
SNIPPET_PATH="${SNIPPET_DIR}/artem-upload-limits.conf"
SITE_CONFIG="${NGINX_SITE_CONFIG:-/etc/nginx/sites-enabled/vibespace}"
UPLOADS_DIR="${MEDIA_UPLOADS_DIR:-/var/www/vibespace-shared/public/media/uploads}"

if ! command -v nginx >/dev/null 2>&1; then
  echo "WARN: nginx not found — skip media nginx patch" >&2
  exit 0
fi

if [[ "$(id -u)" -ne 0 ]]; then
  echo "ERROR: run as root (sudo)" >&2
  exit 1
fi

mkdir -p "${SNIPPET_DIR}" "${UPLOADS_DIR}"
cat > "${SNIPPET_PATH}" <<EOF
# Managed by scripts/ensure-nginx-upload-limit.sh — do not hand-edit.
client_max_body_size ${LIMIT};
EOF

if [[ -f "${SITE_CONFIG}" ]]; then
  python3 - <<PY
from pathlib import Path

path = Path("${SITE_CONFIG}")
text = path.read_text()
marker = "location ^~ /media/uploads/"
block = """
    # Runtime uploads (Next does not pick up new public/ files without restart)
    location ^~ /media/uploads/ {
        alias ${UPLOADS_DIR}/;
        access_log off;
        expires 7d;
        add_header Cache-Control "public";
    }

"""
if marker in text:
    print(f"OK: {path} already has /media/uploads/ alias")
else:
    needle = "    location / {"
    if needle not in text:
        raise SystemExit(f"ERROR: {path} missing 'location /'")
    path.write_text(text.replace(needle, block + needle, 1))
    print(f"OK: patched {path} with /media/uploads/ alias")
PY
else
  echo "WARN: ${SITE_CONFIG} not found — only body size snippet applied" >&2
fi

nginx -t
if command -v systemctl >/dev/null 2>&1 && systemctl is-active --quiet nginx; then
  systemctl reload nginx
else
  nginx -s reload
fi

echo "OK: client_max_body_size ${LIMIT}; uploads dir ${UPLOADS_DIR}"
