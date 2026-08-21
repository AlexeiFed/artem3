#!/usr/bin/env bash
# Первый провижен Ubuntu 24.04 под vibespace (nginx + postgres + node 22 + pm2).
# Запуск на сервере: bash scripts/bootstrap-vps.sh
set -euo pipefail

NODE_VERSION="${DEPLOY_NODE_VERSION:-22}"
APP_PORT="${DEPLOY_PORT:-3001}"
SITE_NAME="${DEPLOY_PM2_NAME:-vibespace}"
LIVE_LINK="${DEPLOY_PATH:-/var/www/vibespace}"
RELEASES_ROOT="${DEPLOY_RELEASES:-/var/www/vibespace-releases}"
SHARED_ROOT="${DEPLOY_SHARED:-/var/www/vibespace-shared}"
UPLOADS_DIR="${SHARED_ROOT}/public/media/uploads"
SITE_CONFIG="/etc/nginx/sites-available/${SITE_NAME}"
SWAP_MB="${SWAP_MB:-2048}"

if [[ "$(id -u)" -ne 0 ]]; then
  echo "ERROR: run as root" >&2
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive
timedatectl set-timezone Asia/Novosibirsk || true

if ! swapon --show | grep -q .; then
  fallocate -l "${SWAP_MB}M" /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  grep -q '^/swapfile ' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
  sysctl vm.swappiness=10 >/dev/null
  grep -q '^vm.swappiness=' /etc/sysctl.conf || echo 'vm.swappiness=10' >> /etc/sysctl.conf
fi

apt-get update -y
apt-get upgrade -y
apt-get install -y --no-install-recommends \
  ca-certificates \
  curl \
  git \
  build-essential \
  python3 \
  nginx \
  postgresql \
  postgresql-contrib \
  ufw \
  fail2ban \
  certbot \
  python3-certbot-nginx \
  unzip \
  openssl

systemctl enable --now postgresql nginx fail2ban

mkdir -p \
  "${RELEASES_ROOT}" \
  "${UPLOADS_DIR}" \
  /root/.config \
  /root/.nvm
chmod 755 /var/www "${RELEASES_ROOT}" "${SHARED_ROOT}"
chmod 775 "${UPLOADS_DIR}"

export NVM_DIR="/root/.nvm"
if [[ ! -s "${NVM_DIR}/nvm.sh" ]]; then
  curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
fi
# shellcheck disable=SC1091
. "${NVM_DIR}/nvm.sh"
nvm install "${NODE_VERSION}"
nvm alias default "${NODE_VERSION}"
nvm use "${NODE_VERSION}"
hash -r

if ! command -v pm2 >/dev/null 2>&1; then
  npm install -g pm2
  hash -r
fi
pm2 startup systemd -u root --hp /root >/dev/null
env PATH="${NVM_DIR}/versions/node/$(nvm version ${NODE_VERSION})/bin:${PATH}" \
  pm2 startup systemd -u root --hp /root | tail -1 | bash || true

rm -f /etc/nginx/sites-enabled/default
cat > "${SITE_CONFIG}" <<NGINX
# Managed by scripts/bootstrap-vps.sh
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name vibespace27.ru www.vibespace27.ru _;

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
ln -sfn "${SITE_CONFIG}" "/etc/nginx/sites-enabled/${SITE_NAME}"
nginx -t
systemctl reload nginx

ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo "BOOTSTRAP_OK node=$(node -v) pm2=$(pm2 -v) postgres=$(sudo -u postgres psql -At -c 'SHOW server_version;')"
echo "NEXT: DEPLOY_HOST=root@$(hostname -I | awk '{print $1}') ./deploy.sh"
echo "HTTPS: после A-записи → certbot --nginx -d vibespace27.ru -d www.vibespace27.ru"
