#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════════
#  Halka Oyunu — Yerel Deploy Kurulum Scripti
#  Bilgisayarında çalıştır (ssh-keygen ve gh CLI gerekli)
#
#  Kullanım:
#    chmod +x deploy/setup-local.sh
#    ./deploy/setup-local.sh
# ═══════════════════════════════════════════════════════════════════════════════
set -euo pipefail

# ── Renk kodları ──────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
info()    { echo -e "${CYAN}[INFO]${NC} $1"; }
success() { echo -e "${GREEN}[OK]${NC}   $1"; }
warn()    { echo -e "${YELLOW}[WARN]${NC} $1"; }
error()   { echo -e "${RED}[ERR]${NC}  $1"; exit 1; }

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║   Halka Oyunu — Deploy Kurulum Sihirbazı  ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# ── Bağımlılık kontrolü ───────────────────────────────────────────────────────
for cmd in ssh-keygen gh; do
  command -v "$cmd" &>/dev/null || error "'$cmd' bulunamadı. Lütfen yükle: brew install gh / apt install openssh-client"
done

# ── Kullanıcı girdileri ───────────────────────────────────────────────────────
read -rp "$(echo -e "${CYAN}VPS IP adresi veya hostname${NC} (örn: 1.2.3.4): ")" VPS_HOST
read -rp "$(echo -e "${CYAN}VPS SSH kullanıcı adı${NC} (örn: root): ")" VPS_USER
read -rp "$(echo -e "${CYAN}Alan adı${NC} (örn: ring.yourdomain.com): ")" DOMAIN
read -rp "$(echo -e "${CYAN}GitHub repo${NC} (örn: ozanturk19/ringsgame): ")" GITHUB_REPO

echo ""

# ── SSH Deploy Key üret ───────────────────────────────────────────────────────
KEY_PATH="$HOME/.ssh/halka_deploy_ed25519"
if [[ -f "$KEY_PATH" ]]; then
  warn "Deploy key zaten var: $KEY_PATH (atlanıyor)"
else
  info "Ed25519 deploy key oluşturuluyor..."
  ssh-keygen -t ed25519 -C "halka-deploy@github-actions" -f "$KEY_PATH" -N ""
  success "Key oluşturuldu: $KEY_PATH"
fi

PRIVATE_KEY=$(cat "$KEY_PATH")
PUBLIC_KEY=$(cat "${KEY_PATH}.pub")

# ── VPS'e public key ekle ─────────────────────────────────────────────────────
info "Public key VPS'e kopyalanıyor ($VPS_USER@$VPS_HOST)..."
ssh "$VPS_USER@$VPS_HOST" "
  mkdir -p ~/.ssh
  chmod 700 ~/.ssh
  echo '$PUBLIC_KEY' >> ~/.ssh/authorized_keys
  chmod 600 ~/.ssh/authorized_keys
  # Deploy dizini oluştur
  mkdir -p /var/www/ring-game
  chown -R $VPS_USER:$VPS_USER /var/www/ring-game 2>/dev/null || true
"
success "Public key VPS'e eklendi"

# ── GitHub Secrets ekle ───────────────────────────────────────────────────────
info "GitHub Secrets ekleniyor ($GITHUB_REPO)..."
gh secret set VPS_SSH_KEY  --body "$PRIVATE_KEY" --repo "$GITHUB_REPO"
gh secret set VPS_HOST     --body "$VPS_HOST"    --repo "$GITHUB_REPO"
gh secret set VPS_USER     --body "$VPS_USER"    --repo "$GITHUB_REPO"
success "GitHub Secrets eklendi (VPS_SSH_KEY, VPS_HOST, VPS_USER)"

# ── Nginx config gönder ───────────────────────────────────────────────────────
info "Nginx config VPS'e gönderiliyor..."
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NGINX_CONF="$SCRIPT_DIR/../nginx/ring-game.conf"

# Alan adını yerleştir
sed "s/ring\.yourdomain\.com/$DOMAIN/g" "$NGINX_CONF" > /tmp/ring-game-nginx.conf

scp /tmp/ring-game-nginx.conf "$VPS_USER@$VPS_HOST:/etc/nginx/sites-available/ring-game"
ssh "$VPS_USER@$VPS_HOST" "
  ln -sf /etc/nginx/sites-available/ring-game /etc/nginx/sites-enabled/ring-game
  nginx -t && systemctl reload nginx
"
success "Nginx config yüklendi ve reload edildi"

# ── SSL sertifikası al ────────────────────────────────────────────────────────
info "Let's Encrypt SSL sertifikası alınıyor ($DOMAIN)..."
ssh "$VPS_USER@$VPS_HOST" "
  command -v certbot &>/dev/null || apt-get install -y certbot python3-certbot-nginx -q
  certbot --nginx -d $DOMAIN --non-interactive --agree-tos -m admin@$DOMAIN --redirect
"
success "SSL sertifikası kuruldu — HTTPS aktif"

# ── İlk Manuel Deploy ─────────────────────────────────────────────────────────
info "İlk deploy yapılıyor (build + rsync)..."
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
(cd "$REPO_ROOT/ring-game" && npm ci && npm run build)

rsync -az --delete \
  -e "ssh -i $KEY_PATH" \
  "$REPO_ROOT/ring-game/dist/" \
  "$VPS_USER@$VPS_HOST:/var/www/ring-game/"

success "İlk deploy tamamlandı"

# ── Özet ─────────────────────────────────────────────────────────────────────
echo ""
echo "╔════════════════════════════════════════════════╗"
echo "║              Kurulum Tamamlandı 🎉              ║"
echo "╚════════════════════════════════════════════════╝"
echo ""
echo -e "  ${GREEN}Oyun adresi  :${NC} https://$DOMAIN"
echo -e "  ${GREEN}GitHub Repo  :${NC} https://github.com/$GITHUB_REPO"
echo -e "  ${GREEN}CI/CD        :${NC} main branch'e her push'ta otomatik deploy"
echo -e "  ${GREEN}Deploy Key   :${NC} $KEY_PATH"
echo ""
echo -e "  ${YELLOW}Sonraki push'tan itibaren GitHub Actions deploy eder.${NC}"
echo ""
