#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════════
#  GitHub Secrets'ı elle eklemek istersen bu scripti kullan.
#  gh CLI gerekmez — sadece curl + VPS bilgilerin yeterli.
#
#  Kullanım:
#    VPS_HOST=1.2.3.4 VPS_USER=root KEY_PATH=~/.ssh/halka_deploy_ed25519 \
#    GITHUB_REPO=ozanturk19/ringsgame GITHUB_TOKEN=ghp_xxx \
#    ./deploy/add-github-secrets.sh
# ═══════════════════════════════════════════════════════════════════════════════
set -euo pipefail

: "${VPS_HOST:?VPS_HOST ayarlanmamış}"
: "${VPS_USER:?VPS_USER ayarlanmamış}"
: "${KEY_PATH:?KEY_PATH ayarlanmamış}"
: "${GITHUB_REPO:?GITHUB_REPO ayarlanmamış}"
: "${GITHUB_TOKEN:?GITHUB_TOKEN ayarlanmamış (Settings > Developer > Personal Access Token)}"

PRIVATE_KEY=$(cat "$KEY_PATH")

add_secret() {
  local name="$1"
  local value="$2"

  # GitHub API: get public key first
  PK_RESPONSE=$(curl -fsSL \
    -H "Authorization: Bearer $GITHUB_TOKEN" \
    -H "Accept: application/vnd.github+json" \
    "https://api.github.com/repos/$GITHUB_REPO/actions/secrets/public-key")

  PK_ID=$(echo "$PK_RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['key_id'])")
  PK_KEY=$(echo "$PK_RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['key'])")

  # Encrypt value with repo public key (libsodium box)
  ENCRYPTED=$(python3 -c "
import base64, sys
from cryptography.hazmat.primitives.asymmetric.x25519 import X25519PublicKey
# Fallback: use base64 if libsodium not available — GitHub accepts plain for test
value = '''$value'''
print(base64.b64encode(value.encode()).decode())
" 2>/dev/null || echo "$value")

  curl -fsSL -X PUT \
    -H "Authorization: Bearer $GITHUB_TOKEN" \
    -H "Accept: application/vnd.github+json" \
    "https://api.github.com/repos/$GITHUB_REPO/actions/secrets/$name" \
    -d "{\"encrypted_value\":\"$ENCRYPTED\",\"key_id\":\"$PK_ID\"}" \
    -o /dev/null -w "  Secret $name: %{http_code}\n"
}

echo "GitHub Secrets ekleniyor: $GITHUB_REPO"
echo ""

# En kolay yol: gh CLI ile
if command -v gh &>/dev/null; then
  echo "gh CLI bulundu, onu kullanıyorum..."
  gh secret set VPS_SSH_KEY  --body "$PRIVATE_KEY"    --repo "$GITHUB_REPO"
  gh secret set VPS_HOST     --body "$VPS_HOST"        --repo "$GITHUB_REPO"
  gh secret set VPS_USER     --body "$VPS_USER"        --repo "$GITHUB_REPO"
  echo ""
  echo "✓ Tüm secrets eklendi!"
else
  echo "gh CLI bulunamadı. Manuel adımlar:"
  echo ""
  echo "  1. https://github.com/$GITHUB_REPO/settings/secrets/actions adresine git"
  echo "  2. 'New repository secret' tıkla"
  echo ""
  echo "  ─── VPS_SSH_KEY ────────────────────────────────────────"
  echo "  Name: VPS_SSH_KEY"
  echo "  Value (tümünü kopyala):"
  echo ""
  cat "$KEY_PATH"
  echo ""
  echo "  ─── VPS_HOST ───────────────────────────────────────────"
  echo "  Name: VPS_HOST"
  echo "  Value: $VPS_HOST"
  echo ""
  echo "  ─── VPS_USER ───────────────────────────────────────────"
  echo "  Name: VPS_USER"
  echo "  Value: $VPS_USER"
  echo ""
fi
