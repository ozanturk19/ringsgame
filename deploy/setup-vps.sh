#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════════
#  Halka Oyunu — VPS Kurulum Scripti
#  VPS'te root olarak çalıştır:
#
#    curl -fsSL https://raw.githubusercontent.com/ozanturk19/ringsgame/main/deploy/setup-vps.sh | bash
#
#  Ubuntu 22.04 / Debian 12 gerektirir.
# ═══════════════════════════════════════════════════════════════════════════════
set -euo pipefail

GREEN='\033[0;32m'; CYAN='\033[0;36m'; NC='\033[0m'
info()    { echo -e "${CYAN}▶${NC} $1"; }
success() { echo -e "${GREEN}✓${NC} $1"; }

WEBROOT="/var/www/ring-game"

# GitHub Actions deploy public key
DEPLOY_PUBLIC_KEY="ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIM+5VMkLJfvuyJMgkKIhDTWtawugz5i1LyMPQKSFb41M halka-deploy@github-actions"

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║     Halka Oyunu — VPS Kurulum             ║"
echo "║     135.181.206.109:8006                  ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# ── Paketler ──────────────────────────────────────────────────────────────────
info "Paketler yükleniyor (nginx, ufw, rsync)..."
apt-get update -qq
apt-get install -y -qq nginx ufw rsync curl
success "Paketler hazır"

# ── Firewall ──────────────────────────────────────────────────────────────────
info "UFW firewall yapılandırılıyor..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 'Nginx HTTP'
ufw allow 'Nginx HTTPS'
ufw --force enable
success "Firewall: SSH + HTTP + HTTPS açık"

# ── Web root ──────────────────────────────────────────────────────────────────
info "Web dizini oluşturuluyor: $WEBROOT"
mkdir -p "$WEBROOT"
chmod 755 "$WEBROOT"

# Geçici index sayfası
cat > "$WEBROOT/index.html" << 'HTML'
<!doctype html>
<html lang="tr">
<head><meta charset="UTF-8"><title>Halka Oyunu — Yakında</title>
<style>body{margin:0;background:#0f0f23;color:#fff;font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;text-align:center}h1{font-size:3rem}p{opacity:.5}</style>
</head>
<body><div><h1>🎮 Halka Oyunu</h1><p>Deploy bekleniyor...</p></div></body>
</html>
HTML
success "Web root hazır: $WEBROOT"

# ── Nginx config ──────────────────────────────────────────────────────────────
info "Nginx yapılandırılıyor..."

cat > /etc/nginx/sites-available/ring-game << 'NGINXEOF'
server {
    listen 80;
    server_name 135.181.206.109 _;

    root /var/www/ring-game;
    index index.html;

    add_header X-Frame-Options        "SAMEORIGIN"   always;
    add_header X-Content-Type-Options "nosniff"      always;

    gzip on;
    gzip_types text/plain text/css application/javascript application/json image/svg+xml;
    gzip_min_length 1024;
    gzip_vary on;

    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    location /sw.js {
        expires -1;
        add_header Cache-Control "no-store, no-cache, must-revalidate";
    }

    location /manifest.json {
        expires 1d;
    }

    location / {
        try_files $uri $uri/ /index.html;
        expires -1;
        add_header Cache-Control "no-store";
    }
}
NGINXEOF

ln -sf /etc/nginx/sites-available/ring-game /etc/nginx/sites-enabled/ring-game
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl enable nginx
systemctl reload nginx
success "Nginx çalışıyor (HTTP)"

# ── Deploy SSH key ────────────────────────────────────────────────────────────
info "GitHub Actions deploy key ekleniyor..."
mkdir -p /root/.ssh
chmod 700 /root/.ssh
touch /root/.ssh/authorized_keys
chmod 600 /root/.ssh/authorized_keys

# Daha önce eklenmemişse ekle
if ! grep -qF "halka-deploy@github-actions" /root/.ssh/authorized_keys 2>/dev/null; then
  echo "$DEPLOY_PUBLIC_KEY" >> /root/.ssh/authorized_keys
  success "Deploy key eklendi"
else
  success "Deploy key zaten var"
fi

# ── Özet ─────────────────────────────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║           VPS Kurulum Tamamlandı! 🎉                  ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""
echo -e "  ${GREEN}Adres   :${NC} http://135.181.206.109"
echo -e "  ${GREEN}Webroot :${NC} $WEBROOT"
echo ""
echo "  Sıradaki: GitHub'da VPS_SSH_KEY secret'ı ekle,"
echo "  ardından main'e push yap → otomatik deploy"
echo ""
