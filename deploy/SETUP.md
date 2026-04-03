# Deploy Kurulum Adımları

## VPS Bilgileri
- **IP**: `135.181.206.109`
- **OS**: Ubuntu/Debian önerilir

---

## Adım 1 — VPS Kurulumu (SSH ile bağlan, root olarak çalıştır)

```bash
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

### `VPS_SSH_KEY` (New repository secret)

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

### `VPS_HOST`
```
135.181.206.109
```

### `VPS_USER`
```
root
```

---

## Adım 3 — İlk Deploy Tetikle

```bash
# Repo'da main'e bir commit push et
git commit --allow-empty -m "trigger: ilk deploy" && git push origin main
```

GitHub Actions çalışır → test → build → VPS'e rsync → `http://135.181.206.109` üzerinde oyun açılır.

---

## Domain Eklenince (SSL için)

```bash
# VPS'te root olarak:
apt install certbot python3-certbot-nginx -y
certbot --nginx -d ring.DOMAIN.com
```

Nginx config `nginx/ring-game.conf` dosyasında HTTPS bloğunun yorumunu kaldır.
