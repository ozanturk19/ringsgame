# Deploy Kurulum Adımları

## VPS Bilgileri
- **IP**: `135.181.206.109`
- **SSH Port**: `8006`
- **OS**: Ubuntu/Debian önerilir

---

## Adım 1 — VPS Kurulumu (SSH ile bağlan, root olarak çalıştır)

```bash
ssh -p 8006 root@135.181.206.109
curl -fsSL https://raw.githubusercontent.com/ozanturk19/ringsgame/main/deploy/setup-vps.sh | bash
```

Bu script şunları yapar:
- Nginx kurar ve yapılandırır
- UFW firewall (SSH + HTTP açık)
- `/var/www/ring-game` web root
- GitHub Actions deploy key'ini `authorized_keys`'e ekler

---

## Adım 2 — GitHub Secret Ekle (1 kez, tarayıcıdan)

**URL:** https://github.com/ozanturk19/ringsgame/settings/secrets/actions

| Secret | Değer |
|--------|-------|
| `VPS_SSH_KEY` | Aşağıdaki private key (tümünü kopyala) |
| `VPS_HOST` | `135.181.206.109` |
| `VPS_USER` | `root` |
| `VPS_SSH_PORT` | `8006` |

### `VPS_SSH_KEY` değeri:

```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtz
c2gtZWQyNTUxOQAAACDPuVTJCyX77siTIJCiIQ01rWsLoM+YtS8jD0CkhW+NTAAA
AJCU/TdulP03bgAAAAtzc2gtZWQyNTUxOQAAACDPuVTJCyX77siTIJCiIQ01rWsL
oM+YtS8jD0CkhW+NTAAAADAwLgIBADAFBgMrZXAEIgQgz7lUyQsl++7IkyCQoiEN
Na1rC6DPmLUvIw9ApIVvjUwAAAAbaGFsa2EtZGVwbG95QGdpdGh1Yi1hY3Rpb25z
AQI=
-----END OPENSSH PRIVATE KEY-----
```

---

## Adım 3 — İlk Deploy Tetikle

```bash
git commit --allow-empty -m "trigger: ilk deploy" && git push origin main
```

GitHub Actions: test → build → rsync (port 8006) → `http://135.181.206.109` 🎮

---

## Domain Eklenince (SSL için)

```bash
# VPS'te root olarak:
apt install certbot python3-certbot-nginx -y
certbot --nginx -d ring.DOMAIN.com
```

Nginx config `nginx/ring-game.conf` dosyasındaki HTTPS bloğunun yorumunu kaldır.
