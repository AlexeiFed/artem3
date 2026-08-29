#!/usr/bin/env bash
# Nginx vhost для artemsysuev.ru (+ www → apex). Safe to re-run.
# Если есть сертификат Let's Encrypt — 80→443 и SSL. Иначе HTTP, IP остаётся default_server.
set -euo pipefail

SITE_HOST="${SITE_HOST:-artemsysuev.ru}"
APP_PORT="${APP_PORT:-3001}"
SITE_NAME="${DEPLOY_PM2_NAME:-vibespace}"
SITE_CONFIG="${NGINX_SITE_CONFIG:-/etc/nginx/sites-available/${SITE_NAME}}"
UPLOADS_DIR="${MEDIA_UPLOADS_DIR:-/var/www/vibespace-shared/public/media/uploads}"
CERT_DIR="${CERT_DIR:-/etc/letsencrypt/live/${SITE_HOST}}"
CERTBOT_EMAIL="${CERTBOT_EMAIL:-artem-sysuev@yandex.ru}"
SKIP_CERTBOT="${SKIP_CERTBOT:-0}"

if ! command -v nginx >/dev/null 2>&1; then
  echo "WARN: nginx not found — skip site vhost" >&2
  exit 0
fi

if [[ "$(id -u)" -ne 0 ]]; then
  echo "ERROR: run as root" >&2
  exit 1
fi

mkdir -p "${UPLOADS_DIR}" /etc/nginx/sites-available /etc/nginx/sites-enabled

write_http_only() {
  cat > "${SITE_CONFIG}" <<NGINX
# Managed by scripts/ensure-nginx-site.sh — do not hand-edit.
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    client_max_body_size 105m;

    location ^~ /media/uploads/ {
        alias ${UPLOADS_DIR}/;
        access_log off;
        expires 7d;
        add_header Cache-Control "public";
    }

    location / {
        proxy_pass http://127.0.0.1:${APP_PORT};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 60s;
    }
}

server {
    listen 80;
    listen [::]:80;
    server_name ${SITE_HOST} www.${SITE_HOST};

    client_max_body_size 105m;

    location ^~ /media/uploads/ {
        alias ${UPLOADS_DIR}/;
        access_log off;
        expires 7d;
        add_header Cache-Control "public";
    }

    location / {
        proxy_pass http://127.0.0.1:${APP_PORT};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 60s;
    }
}
NGINX
}

write_https() {
  local ssl_extras=""
  if [[ -f /etc/letsencrypt/options-ssl-nginx.conf ]]; then
    ssl_extras="    include /etc/letsencrypt/options-ssl-nginx.conf;"
  else
    ssl_extras="    ssl_protocols TLSv1.2 TLSv1.3;"
  fi
  if [[ -f /etc/letsencrypt/ssl-dhparams.pem ]]; then
    ssl_extras="${ssl_extras}
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;"
  fi

  cat > "${SITE_CONFIG}" <<NGINX
# Managed by scripts/ensure-nginx-site.sh — do not hand-edit.
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    client_max_body_size 105m;

    location ^~ /media/uploads/ {
        alias ${UPLOADS_DIR}/;
        access_log off;
        expires 7d;
        add_header Cache-Control "public";
    }

    location / {
        proxy_pass http://127.0.0.1:${APP_PORT};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 60s;
    }
}

server {
    listen 80;
    listen [::]:80;
    server_name ${SITE_HOST} www.${SITE_HOST};
    return 301 https://${SITE_HOST}\$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name www.${SITE_HOST};

    ssl_certificate ${CERT_DIR}/fullchain.pem;
    ssl_certificate_key ${CERT_DIR}/privkey.pem;
${ssl_extras}

    return 301 https://${SITE_HOST}\$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ${SITE_HOST};

    ssl_certificate ${CERT_DIR}/fullchain.pem;
    ssl_certificate_key ${CERT_DIR}/privkey.pem;
${ssl_extras}

    client_max_body_size 105m;

    location ^~ /media/uploads/ {
        alias ${UPLOADS_DIR}/;
        access_log off;
        expires 7d;
        add_header Cache-Control "public";
    }

    location / {
        proxy_pass http://127.0.0.1:${APP_PORT};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 60s;
    }
}
NGINX
}

reload_nginx() {
  nginx -t
  if command -v systemctl >/dev/null 2>&1 && systemctl is-active --quiet nginx; then
    systemctl reload nginx
  else
    nginx -s reload
  fi
}

rm -f /etc/nginx/sites-enabled/default
ln -sfn "${SITE_CONFIG}" "/etc/nginx/sites-enabled/${SITE_NAME}"

if [[ -f "${CERT_DIR}/fullchain.pem" && -f "${CERT_DIR}/privkey.pem" ]]; then
  write_https
else
  write_http_only
fi
reload_nginx

if [[ "${SKIP_CERTBOT}" != "1" ]] && command -v certbot >/dev/null 2>&1; then
  if [[ ! -f "${CERT_DIR}/fullchain.pem" ]]; then
    echo "==> certbot ${SITE_HOST} www.${SITE_HOST}"
    if certbot certonly --nginx \
      -d "${SITE_HOST}" -d "www.${SITE_HOST}" \
      --non-interactive --agree-tos \
      --email "${CERTBOT_EMAIL}" \
      --keep-until-expiring \
      --expand; then
      write_https
      reload_nginx
      echo "OK: TLS ${SITE_HOST}"
    else
      echo "WARN: certbot не выпустил сертификат (DNS ещё не смотрит сюда?) — оставляю HTTP" >&2
    fi
  fi
fi

if [[ -f "${CERT_DIR}/fullchain.pem" ]]; then
  echo "NGINX_SITE=https://${SITE_HOST}"
else
  echo "NGINX_SITE=http://${SITE_HOST}"
fi
