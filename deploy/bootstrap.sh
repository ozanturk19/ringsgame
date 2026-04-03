#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════════
#  Halka Oyunu — Tek Komutla Tam Kurulum
#  Kendi bilgisayarında çalıştır (macOS / Linux):
#    bash <(curl -fsSL https://raw.githubusercontent.com/ozanturk19/ringsgame/main/deploy/bootstrap.sh)
# ═══════════════════════════════════════════════════════════════════════════════
set -euo pipefail

VPS_HOST="135.181.206.109"
VPS_USER="root"
VPS_PORT=""
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

# ── Temel araçlar ─────────────────────────────────────────────────────────────
step "Temel araçlar kontrol ediliyor"
for cmd in ssh ssh-keygen rsync curl git nc; do
  command -v "$cmd" &>/dev/null && success "$cmd" || die "$cmd bulunamadı — lütfen yükle"
done

# ── gh CLI otomatik kurulumu ──────────────────────────────────────────────────
step "GitHub CLI (gh) kuruluyor"

install_gh() {
  local os
  os="$(uname -s)"

  if [[ "$os" == "Darwin" ]]; then
    # Homebrew yoksa önce onu kur
    if ! command -v brew &>/dev/null; then
      info "Homebrew kuruluyor..."
      /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
      # Apple Silicon path
      [[ -f /opt/homebrew/bin/brew ]] && eval "$(/opt/homebrew/bin/brew shellenv)"
      # Intel path
      [[ -f /usr/local/bin/brew ]] && eval "$(/usr/local/bin/brew shellenv)"
    fi
    info "Homebrew ile gh kuruluyor..."
    brew install gh

  elif [[ "$os" == "Linux" ]]; then
    if command -v apt-get &>/dev/null; then
      info "apt ile gh kuruluyor..."
      curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg \
        | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
      echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] \
        https://cli.github.com/packages stable main" \
        | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
      sudo apt-get update -q
      sudo apt-get install -y gh
    elif command -v dnf &>/dev/null; then
      info "dnf ile gh kuruluyor..."
      sudo dnf install -y 'dnf-command(config-manager)'
      sudo dnf config-manager --add-repo https://cli.github.com/packages/rpm/gh-cli.repo
      sudo dnf install -y gh
    elif command -v yum &>/dev/null; then
      sudo yum install -y gh
    else
      # Fallback: binary
      info "Binary olarak indiriliyor..."
      GH_VER=$(curl -fsSL https://api.github.com/repos/cli/cli/releases/latest | grep '"tag_name"' | cut -d'"' -f4 | tr -d v)
      ARCH=$(uname -m); [[ "$ARCH" == "x86_64" ]] && ARCH="amd64"
      curl -fsSL "https://github.com/cli/cli/releases/download/v${GH_VER}/gh_${GH_VER}_linux_${ARCH}.tar.gz" \
        | tar -xz -C /tmp
      sudo mv "/tmp/gh_${GH_VER}_linux_${ARCH}/bin/gh" /usr/local/bin/gh
    fi
  else
    die "Desteklenmeyen işletim sistemi: $os"
  fi
}

if command -v gh &>/dev/null; then
  success "gh zaten kurulu: $(gh --version | head -1)"
else
  install_gh
  command -v gh &>/dev/null && success "gh kuruldu" || die "gh kurulumu başarısız"
fi

# ── GitHub auth ───────────────────────────────────────────────────────────────
step "GitHub girişi"
if ! gh auth status &>/dev/null; then
  info "GitHub'a giriş yapılıyor (tarayıcı açılacak)..."
  gh auth login --hostname github.com --git-protocol https --web
fi
success "GitHub auth OK"

# ── SSH portu bul ─────────────────────────────────────────────────────────────
step "SSH portu bulunuyor ($VPS_HOST)"

find_ssh_port() {
  local common_ports=(22 2222 2200 4022 8022 8006 1022 10022)
  for p in "${common_ports[@]}"; do
    info "Port $p deneniyor..."
    if nc -z -w5 "$VPS_HOST" "$p" 2>/dev/null; then
      # Gerçekten SSH mi? — banner oku
      banner=$(nc -w5 "$VPS_HOST" "$p" 2>/dev/null </dev/null | head -1 || true)
      if echo "$banner" | grep -qi "ssh"; then
        echo "$p"
        return 0
      fi
    fi
  done
  return 1
}

if [[ -z "$VPS_PORT" ]]; then
  if AUTO_PORT=$(find_ssh_port 2>/dev/null); then
    VPS_PORT="$AUTO_PORT"
    success "SSH portu bulundu: $VPS_PORT"
  else
    warn "SSH portu otomatik bulunamadı."
    echo ""
    echo "  Hetzner/Proxmox kullanıyorsan:"
    echo "  - Proxmox web arayüzünden VM'e gir (port 8006 web UI'dır, SSH değil)"
    echo "  - Server'ın SSH portu genellikle 22'dir"
    echo "  - Hetzner Cloud Console > Server > SSH"
    echo ""
    read -rp "SSH portu: " VPS_PORT
    [[ -n "$VPS_PORT" ]] || die "Port boş bırakılamaz"
  fi
fi

info "SSH bağlantısı deneniyor ($VPS_HOST:$VPS_PORT)..."
# nc hem macOS hem Linux'ta çalışır (timeout komutu macOS'ta yok)
if nc -z -w8 "$VPS_HOST" "$VPS_PORT" 2>/dev/null; then
  success "Port $VPS_PORT erişilebilir"
else
  warn "TCP probe başarısız — SSH doğrudan deneniyor..."
fi

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
step "VPS kurulumu ($VPS_HOST:$VPS_PORT)"

info "Deploy public key VPS'e ekleniyor..."
ssh -p "$VPS_PORT" \
    -o StrictHostKeyChecking=no \
    -o ConnectTimeout=15 \
    "$VPS_USER@$VPS_HOST" \
    "mkdir -p ~/.ssh && chmod 700 ~/.ssh
     grep -qF 'halka-deploy@github-actions' ~/.ssh/authorized_keys 2>/dev/null \
       || echo '$PUB_KEY' >> ~/.ssh/authorized_keys
     chmod 600 ~/.ssh/authorized_keys
     echo 'Key eklendi'"
success "Deploy public key VPS'e eklendi"

info "VPS kurulum scripti çalıştırılıyor (nginx, ufw, webroot)..."
ssh -p "$VPS_PORT" -o StrictHostKeyChecking=no "$VPS_USER@$VPS_HOST" \
  "curl -fsSL https://raw.githubusercontent.com/$GITHUB_REPO/main/deploy/setup-vps.sh | bash"
success "VPS kurulumu tamamlandı"

# ── GitHub Secrets ─────────────────────────────────────────────────────────────
step "GitHub Secrets ekleniyor"
gh secret set VPS_SSH_KEY  --body "$PRIV_KEY"  --repo "$GITHUB_REPO"
gh secret set VPS_HOST     --body "$VPS_HOST"  --repo "$GITHUB_REPO"
gh secret set VPS_USER     --body "$VPS_USER"  --repo "$GITHUB_REPO"
gh secret set VPS_SSH_PORT --body "$VPS_PORT"  --repo "$GITHUB_REPO"
success "4 secret eklendi"

# ── GitHub Actions ile Deploy ─────────────────────────────────────────────────
step "GitHub Actions deploy tetikleniyor"

info "workflow_dispatch ile deploy başlatılıyor..."
gh workflow run deploy.yml --repo "$GITHUB_REPO" --ref main

# Run ID'yi al (birkaç saniye bekle, workflow başlaması zaman alır)
sleep 6
RUN_ID=$(gh run list --repo "$GITHUB_REPO" --workflow deploy.yml \
  --limit 1 --json databaseId -q '.[0].databaseId' 2>/dev/null || true)

if [[ -n "$RUN_ID" ]]; then
  info "Workflow Run #$RUN_ID izleniyor (birkaç dakika sürebilir)..."
  gh run watch "$RUN_ID" --repo "$GITHUB_REPO" --exit-status \
    && success "GitHub Actions deploy tamamlandı!" \
    || die "Deploy başarısız → https://github.com/$GITHUB_REPO/actions adresini kontrol et"
else
  warn "Run ID alınamadı — deploy arka planda devam ediyor"
  info "Takip et: https://github.com/$GITHUB_REPO/actions"
fi

# ── Özet ─────────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}║              Kurulum Tamamlandı! 🎉                   ║${NC}"
echo -e "${BOLD}╚══════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  ${GREEN}Oyun adresi  :${NC} http://$VPS_HOST"
echo -e "  ${GREEN}GitHub CI/CD :${NC} https://github.com/$GITHUB_REPO/actions"
echo -e "  ${GREEN}Deploy key   :${NC} $KEY_PATH"
echo ""
echo -e "  ${CYAN}Bundan sonra:${NC} git push origin main → otomatik deploy"
echo ""
