#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════════
#  Halka Oyunu — VPS Sunucu Kurulum Scripti
#  VPS'te root olarak çalıştır (tek seferlik):
#    curl -fsSL https://raw.githubusercontent.com/ozanturk19/ringsgame/main/deploy/setup-vps.sh | bash
#
#  Gereksinimler: Ubuntu 22.04+ / Debian 12+
# ═══════════════════════════════════════════════════════════════════════════════
set -euo pipefail

DOMAIN="${DOMAIN:-ring.yourdomain.com}"
DEPLOY_USER="${DEPLOY_USER:-deploy}"
WEBROOT="/var/www/ring-game"

RED='\033[0;31m'; GREEN='\033[0;32m'; CYAN='\033[0;36m'; NC='\033[0m'
info()    { echo -e "${CYAN}[INFO]${NC} $1"; }
success() { echo -e "${GREEN}[OK]${NC}   $1"; }

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║     Halka Oyunu — VPS Kurulum Scripti     ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# ── System update ──────────────────────────────────────────────────────────────
info "Sistem güncelleniyor..."
apt-get update -qq
apt-get install -y -qq nginx certbot python3-certbot-nginx rsync curl ufw

# ── Firewall ──────────────────────────────────────────────────────────────────
info "UFW güvenlik duvarı yapılandırılıyor..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 'Nginx Full'
ufw --force enable
success "Firewall aktif (SSH + HTTP + HTTPS)"

# ── Deploy kullanıcısı ────────────────────────────────────────────────────────
info "Deploy kullanıcısı oluşturuluyor ($DEPLOY_USER)..."
if ! id "$DEPLOY_USER" &>/dev/null; then
  useradd --system --no-create-home --shell /bin/bash "$DEPLOY_USER"
fi

# ── Web root ──────────────────────────────────────────────────────────────────
info "Web dizini oluşturuluyor: $WEBROOT"
mkdir -p "$WEBROOT"
chown -R "$DEPLOY_USER:$DEPLOY_USER" "$WEBROOT"
chmod 755 "$WEBROOT"

# ── Nginx config ──────────────────────────────────────────────────────────────
info "Nginx geçici config yazılıyor (HTTP only, Certbot için)..."
cat > /etc/nginx/sites-available/ring-game << NGINXEOF
server {
    listen 80;
    server_name $DOMAIN;
    root $WEBROOT;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Certbot challenge
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
}
NGINXEOF

mkdir -p /var/www/certbot
ln -sf /etc/nginx/sites-available/ring-game /etc/nginx/sites-enabled/ring-game
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
success "Nginx çalışıyor (HTTP)"

# ── SSL sertifikası ───────────────────────────────────────────────────────────
info "Let's Encrypt SSL sertifikası alınıyor ($DOMAIN)..."
EMAIL="${SSL_EMAIL:-admin@$DOMAIN}"
certbot certonly --webroot \
  -w /var/www/certbot \
  -d "$DOMAIN" \
  --non-interactive \
  --agree-tos \
  -m "$EMAIL" \
  --keep-until-expiring

# ── Nginx HTTPS config (final) ────────────────────────────────────────────────
info "Nginx HTTPS config yazılıyor..."
cat > /etc/nginx/sites-available/ring-game << NGINXEOF
server {
    listen 80;
    server_name $DOMAIN;
    return 301 https://\$host\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN;

    ssl_certificate     /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    include             /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam         /etc/letsencrypt/ssl-dhparams.pem;

    root $WEBROOT;
    index index.html;

    add_header X-Frame-Options           "SAMEORIGIN"   always;
    add_header X-Content-Type-Options    "nosniff"      always;
    add_header Referrer-Policy           "strict-origin" always;

    gzip on;
    gzip_types text/plain text/css application/javascript application/json image/svg+xml;
    gzip_min_length 1024;
    gzip_vary on;

    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files \$uri =404;
    }

    location /sw.js {
        expires -1;
        add_header Cache-Control "no-store, no-cache, must-revalidate";
    }

    location /manifest.json {
        expires 1d;
        add_header Cache-Control "public";
    }

    location / {
        try_files \$uri \$uri/ /index.html;
        expires -1;
        add_header Cache-Control "no-store";
    }
}
NGINXEOF

nginx -t && systemctl reload nginx
success "Nginx HTTPS aktif"

# ── Certbot auto-renewal ──────────────────────────────────────────────────────
info "Certbot otomatik yenileme cron'u ekleniyor..."
(crontab -l 2>/dev/null || true; echo "0 3 * * * certbot renew --quiet && systemctl reload nginx") | crontab -
success "SSL otomatik yenileme kuruldu (her gün 03:00)"

# ── Deploy SSH authorized_keys ────────────────────────────────────────────────
info "Deploy kullanıcısı için SSH dizini hazırlanıyor..."
mkdir -p "/home/$DEPLOY_USER/.ssh" 2>/dev/null || mkdir -p "/root/.ssh"
# GitHub Actions public key buraya eklenecek (setup-local.sh bunu yapıyor)
echo "# GitHub Actions deploy key buraya gelecek — setup-local.sh ile otomatik eklenir" \
  > "/root/.ssh/authorized_keys" 2>/dev/null || true
chmod 700 "/root/.ssh" 2>/dev/null || true
chmod 600 "/root/.ssh/authorized_keys" 2>/dev/null || true

# ── Nginx enable on boot ──────────────────────────────────────────────────────
systemctl enable nginx

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║           VPS Kurulum Tamamlandı! 🎉                  ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""
echo -e "  ${GREEN}Alan adı   :${NC} https://$DOMAIN"
echo -e "  ${GREEN}Web dizini :${NC} $WEBROOT"
echo -e "  ${GREEN}SSL        :${NC} Let's Encrypt (otomatik yenileme aktif)"
echo ""
echo "  Sıradaki adım: Kendi bilgisayarında deploy/setup-local.sh çalıştır"
echo ""
