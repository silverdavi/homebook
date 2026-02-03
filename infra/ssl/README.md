# SSL Certificate Management

## teacher.ninja (frontend)
- **Provider:** Vercel (automatic)
- **No action required** - Vercel auto-provisions and renews SSL

## api.teacher.ninja (API)
- **Provider:** Let's Encrypt via Certbot
- **Auto-renewal:** Enabled via systemd timer (`certbot.timer`)

### Initial Setup
```bash
sudo certbot --nginx -d api.teacher.ninja --non-interactive --agree-tos -m admin@teacher.ninja
```

### Manual Renewal
```bash
sudo certbot renew
```

### Check Certificate Status
```bash
sudo certbot certificates
```

### Verify Auto-Renewal Timer
```bash
sudo systemctl status certbot.timer
```
