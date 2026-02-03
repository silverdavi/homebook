# teacher.ninja DNS Configuration

## Domain Info
- **Domain:** teacher.ninja
- **Registrar:** AWS Route53
- **Hosted Zone ID:** Z04548183EDB0GCZBQSI9

## DNS Records

| Record | Type | Value | Status |
|--------|------|-------|--------|
| `teacher.ninja` | A | 76.76.21.21 (Vercel) | Propagated |
| `www.teacher.ninja` | CNAME | cname.vercel-dns.com | Propagated |
| `api.teacher.ninja` | A | (EC2 IP - pending instance creation) | Pending |

## Propagation Verified: 2026-02-03
- `teacher.ninja` resolves to `76.76.21.21`
- `www.teacher.ninja` resolves via `cname.vercel-dns.com`
- `api.teacher.ninja` not yet configured (awaiting EC2 instance)

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        teacher.ninja                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   teacher.ninja (A) ──────────► Vercel (Next.js frontend)       │
│   www.teacher.ninja (CNAME) ──► Vercel                           │
│                                                                  │
│   api.teacher.ninja (A) ──────► EC2 / Lambda (Python generator) │
│                                                                  │
│   SSL: Managed by Vercel (frontend) + ACM/Let's Encrypt (API)   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Setup Commands

### Apply DNS Records (after filling in placeholders)
```bash
aws route53 change-resource-record-sets \
  --hosted-zone-id Z04548183EDB0GCZBQSI9 \
  --change-batch file://infra/aws/dns-records.json
```

### Verify DNS Propagation
```bash
dig teacher.ninja +short
dig www.teacher.ninja +short
dig api.teacher.ninja +short
```

### Vercel Domain Setup
1. Go to Vercel Dashboard → Project → Settings → Domains
2. Add `teacher.ninja` and `www.teacher.ninja`
3. Vercel will auto-provision SSL

### API SSL (Let's Encrypt via Certbot)
```bash
# On EC2 instance
sudo certbot --nginx -d api.teacher.ninja
```

## CORS Configuration

The S3 bucket already has CORS configured for:
- `http://localhost:3000` (development)
- `https://teacher.ninja`
- `https://www.teacher.ninja`
- `https://*.vercel.app` (preview deployments)

Update S3 CORS if needed:
```bash
aws s3api put-bucket-cors \
  --bucket homebook-worksheets \
  --cors-configuration file://infra/aws/s3-cors.json
```
