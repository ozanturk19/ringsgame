# Deploy Kurulum

Tek komutla tam kurulum (macOS veya Linux):

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/ozanturk19/ringsgame/main/deploy/bootstrap.sh)
```

Bu script otomatik olarak:
1. SSH deploy key üretir
2. VPS'e Nginx + firewall kurar
3. GitHub Secrets'ları ayarlar
4. İlk deploy'u tetikler

Kurulum sonrası: `git push origin main` → otomatik deploy

---

## Domain Eklenince (SSL için)

```bash
# VPS'te root olarak:
apt install certbot python3-certbot-nginx -y
certbot --nginx -d ring.DOMAIN.com
```

Nginx config `nginx/ring-game.conf` dosyasındaki HTTPS bloğunun yorumunu kaldır.
