# Deploy Rehberi — Halka Oyunu

## Hızlı Başlangıç (2 Adım)

### Adım 1 — VPS'te (root olarak, tek seferlik)

```bash
# Alan adını ayarla ve çalıştır
DOMAIN=ring.yourdomain.com bash <(curl -fsSL \
  https://raw.githubusercontent.com/ozanturk19/ringsgame/main/deploy/setup-vps.sh)
```

Bu script şunları yapar:
- Nginx kurar ve yapılandırır
- Let's Encrypt SSL sertifikası alır (otomatik yenileme dahil)
- UFW firewall'u ayarlar
- `/var/www/ring-game` deploy dizinini oluşturur

### Adım 2 — Kendi bilgisayarında (tek seferlik)

```bash
chmod +x deploy/setup-local.sh
./deploy/setup-local.sh
```

Sihirbaz şunları sorar ve yapar:
- VPS IP / alan adı / GitHub repo bilgileri
- Ed25519 SSH deploy key üretir
- Public key'i VPS'e ekler
- GitHub Secrets'a ekler (VPS_SSH_KEY, VPS_HOST, VPS_USER)
- İlk deploy'u yapar

---

## Sonrasında

`main` branch'e her push'ta GitHub Actions otomatik olarak:
1. `npm test` — 49 unit test çalıştırır
2. `npm run build` — production build
3. `rsync` — VPS'e deploy

## Secrets

| Secret | Açıklama |
|--------|----------|
| `VPS_SSH_KEY` | Deploy için Ed25519 private key |
| `VPS_HOST` | VPS IP adresi veya hostname |
| `VPS_USER` | SSH kullanıcı adı (genellikle `root`) |

## Nginx Config

`nginx/ring-game.conf` dosyasındaki `ring.yourdomain.com` kısımlarını kendi alan adınla değiştir.

## SSL Yenileme

Certbot cron job'u her gün 03:00'de otomatik yeniler. Elle yenilemek için:
```bash
certbot renew && systemctl reload nginx
```
