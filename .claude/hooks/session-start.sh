#!/bin/bash
set -euo pipefail

# Only run inside Claude Code on the web (remote sandbox).
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

# VPS SSH access. Set these as environment secrets in the web environment:
#   VPS_SSH_KEY  - private key contents (full PEM/OpenSSH block)
#   VPS_HOST     - VPS IP or hostname
#   VPS_USER     - SSH user
#   VPS_PORT     - optional, defaults to 22
if [ -z "${VPS_SSH_KEY:-}" ] || [ -z "${VPS_HOST:-}" ] || [ -z "${VPS_USER:-}" ]; then
  echo "VPS secrets missing (VPS_SSH_KEY / VPS_HOST / VPS_USER) - skipping SSH setup" >&2
  exit 0
fi

VPS_PORT="${VPS_PORT:-22}"

mkdir -p ~/.ssh
chmod 700 ~/.ssh

KEY_FILE="$HOME/.ssh/vps_key"
printf '%s\n' "$VPS_SSH_KEY" > "$KEY_FILE"
chmod 600 "$KEY_FILE"

# Host alias 'vps' so the agent can run: ssh vps "<command>"
CONFIG_FILE="$HOME/.ssh/config"
touch "$CONFIG_FILE"
chmod 600 "$CONFIG_FILE"
if ! grep -q '^Host vps$' "$CONFIG_FILE" 2>/dev/null; then
  cat >> "$CONFIG_FILE" <<EOF

Host vps
  HostName $VPS_HOST
  User $VPS_USER
  Port $VPS_PORT
  IdentityFile $KEY_FILE
  IdentitiesOnly yes
  StrictHostKeyChecking accept-new
EOF
fi

# Pre-populate known_hosts so the first connection is non-interactive.
ssh-keyscan -p "$VPS_PORT" -H "$VPS_HOST" >> ~/.ssh/known_hosts 2>/dev/null || true
if [ -f ~/.ssh/known_hosts ]; then
  sort -u ~/.ssh/known_hosts -o ~/.ssh/known_hosts || true
  chmod 600 ~/.ssh/known_hosts
fi

# Connectivity check (non-fatal).
if ssh -o ConnectTimeout=10 -o BatchMode=yes vps "echo ok" >/dev/null 2>&1; then
  echo "VPS SSH ready - use: ssh vps \"<command>\"" >&2
else
  echo "VPS SSH configured but test connection failed - check secrets and network policy" >&2
fi

exit 0
