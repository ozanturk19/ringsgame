#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════════
#  Halka Oyunu — Tek Komutla Tam Kurulum
#  Kendi bilgisayarında çalıştır (macOS / Linux):
#    bash <(curl -fsSL https://raw.githubusercontent.com/ozanturk19/ringsgame/main/deploy/bootstrap.sh)
# ═══════════════════════════════════════════════════════════════════════════════
set -euo pipefail

VPS_HOST="135.181.206.109"
VPS_USER="root"
VPS_PORT="8006"
GITHUB_REPO="ozanturk19/ringsgame"
KEY_PATH="$HOME/.ssh/halka_deploy_ed25519"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'
info()    { echo -e "${CYAN}▶${NC} $1"; }
success() { echo -e "${GREEN}✓${NC} $1"; }
warn()    { echo -e "${YELLOW}!${NC} $1"; }
die()     { echo -e "${RED}✗${NC} $1"; exit 1; }
step()    { echo -e "\n${BOLD}── $1 ──────────────────────────────${NC}"; }

echo ""
echo -e "${BOLD}╔══════════════════════════════════════════╗${NC}"
echo -e "${BOLD}║   Halka Oyunu — Tam Otomatik Kurulum      ║${NC}"
echo -e "${BOLD}╚══════════════════════════════════════════╝${NC}"
echo ""

# ── Ön kontroller ─────────────────────────────────────────────────────────────
step "Gereksinimler kontrol ediliyor"
for cmd in ssh ssh-keygen rsync curl; do
  command -v "$cmd" &>/dev/null && success "$cmd" || die "$cmd bulunamadı"
done

# gh CLI kontrolü — secret eklemek için şart
if ! command -v gh &>/dev/null; then
  warn "gh (GitHub CLI) bulunamadı. Yüklemek için:"
  echo "  macOS : brew install gh"
  echo "  Linux : https://cli.github.com/manual/installation"
  read -rp "gh kurulumu tamamlandıktan sonra devam etmek için Enter'a bas..." _
  command -v gh &>/dev/null || die "gh hâlâ bulunamadı"
fi

# GitHub auth kontrolü
gh auth status &>/dev/null || { warn "GitHub'a giriş yapılıyor..."; gh auth login; }
success "GitHub auth OK"

# VPS erişim kontrolü
step "VPS bağlantısı test ediliyor ($VPS_HOST:$VPS_PORT)"
timeout 8 bash -c "echo >/dev/tcp/$VPS_HOST/$VPS_PORT" 2>/dev/null \
  && success "Port $VPS_PORT erişilebilir" \
  || die "Port $VPS_PORT erişilemiyor. VPS'in açık ve SSH'ın $VPS_PORT'ta çalıştığını kontrol et."

# ── SSH Deploy Key ─────────────────────────────────────────────────────────────
step "SSH deploy key"
if [[ -f "$KEY_PATH" ]]; then
  success "Deploy key zaten var: $KEY_PATH"
else
  info "Ed25519 key üretiliyor..."
  ssh-keygen -t ed25519 -C "halka-deploy@github-actions" -f "$KEY_PATH" -N ""
  success "Key üretildi: $KEY_PATH"
fi
PUB_KEY=$(cat "${KEY_PATH}.pub")
PRIV_KEY=$(cat "$KEY_PATH")

# ── VPS Kurulumu ──────────────────────────────────────────────────────────────
step "VPS kurulumu ($VPS_USER@$VPS_HOST:$VPS_PORT)"

# Public key VPS'e gönder
info "Public key VPS'e ekleniyor..."
ssh -p "$VPS_PORT" \
    -o StrictHostKeyChecking=no \
    -o ConnectTimeout=15 \
    "$VPS_USER@$VPS_HOST" \
    "mkdir -p ~/.ssh && chmod 700 ~/.ssh && \
     grep -qF 'halka-deploy@github-actions' ~/.ssh/authorized_keys 2>/dev/null || \
     echo '$PUB_KEY' >> ~/.ssh/authorized_keys && \
     chmod 600 ~/.ssh/authorized_keys"
success "Deploy public key VPS'e eklendi"

# VPS'te kurulum scriptini çalıştır
info "VPS kurulum scripti çalıştırılıyor (nginx, ufw, webroot)..."
ssh -p "$VPS_PORT" \
    -o StrictHostKeyChecking=no \
    "$VPS_USER@$VPS_HOST" \
    "curl -fsSL https://raw.githubusercontent.com/$GITHUB_REPO/main/deploy/setup-vps.sh | bash"
success "VPS kurulumu tamamlandı"

# ── GitHub Secrets ─────────────────────────────────────────────────────────────
step "GitHub Secrets ekleniyor ($GITHUB_REPO)"
gh secret set VPS_SSH_KEY  --body "$PRIV_KEY"  --repo "$GITHUB_REPO"
gh secret set VPS_HOST     --body "$VPS_HOST"  --repo "$GITHUB_REPO"
gh secret set VPS_USER     --body "$VPS_USER"  --repo "$GITHUB_REPO"
gh secret set VPS_SSH_PORT --body "$VPS_PORT"  --repo "$GITHUB_REPO"
success "4 secret eklendi (VPS_SSH_KEY, VPS_HOST, VPS_USER, VPS_SSH_PORT)"

# ── İlk Deploy ────────────────────────────────────────────────────────────────
step "İlk deploy tetikleniyor"

# Repo yoksa klonla
REPO_DIR="/tmp/ringsgame-bootstrap"
if [[ ! -d "$REPO_DIR" ]]; then
  info "Repo klonlanıyor..."
  git clone "https://github.com/$GITHUB_REPO.git" "$REPO_DIR"
fi

info "Build + rsync ile doğrudan deploy..."
(
  cd "$REPO_DIR/ring-game"
  npm ci --silent
  npm run build --silent
)

rsync -az --delete --checksum \
  -e "ssh -i $KEY_PATH -p $VPS_PORT -o StrictHostKeyChecking=no" \
  "$REPO_DIR/ring-game/dist/" \
  "$VPS_USER@$VPS_HOST:/var/www/ring-game/"

# Doğrula
ssh -i "$KEY_PATH" -p "$VPS_PORT" -o StrictHostKeyChecking=no \
  "$VPS_USER@$VPS_HOST" \
  "ls /var/www/ring-game/index.html"
success "Deploy tamamlandı"

# ── Özet ─────────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}║              Kurulum Tamamlandı! 🎉                   ║${NC}"
echo -e "${BOLD}╚══════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  ${GREEN}Oyun       :${NC} http://$VPS_HOST"
echo -e "  ${GREEN}GitHub     :${NC} https://github.com/$GITHUB_REPO/actions"
echo -e "  ${GREEN}Deploy Key :${NC} $KEY_PATH"
echo ""
echo -e "  ${CYAN}Bundan sonra:${NC} main'e her git push → otomatik deploy"
echo ""

# Temizle
rm -rf "$REPO_DIR"
