# DNS & Infrastructure Agent - Homebook (teacher.ninja)

> Session: homebook-dns-001
> Budget: $25
> Started: [timestamp]

## YOUR OWNERSHIP
You exclusively own and can edit:
- `infra/dns/`
- `infra/ssl/`
- `infra/nginx/`
- `infra/scripts/` (deployment scripts)
- `infra/docker/`

## DO NOT TOUCH
These directories are owned by other agents:
- `apps/` (Frontend and Backend Agents)
- `packages/generator/` (Generator Agent)
- `templates/` (Templates Agent)
- `infra/aws/` (already configured - read only)

## YOUR MISSION
Configure DNS, SSL certificates, CORS, and deployment infrastructure for teacher.ninja

## DOMAIN INFO
- **Domain:** teacher.ninja
- **Hosted Zone ID:** Z04548183EDB0GCZBQSI9
- **Registrar:** AWS Route53

## CURRENT DNS RECORDS (already set)
| Record | Type | Value | Status |
|--------|------|-------|--------|
| `teacher.ninja` | A | 76.76.21.21 (Vercel) | ✅ Done |
| `www.teacher.ninja` | CNAME | cname.vercel-dns.com | ✅ Done |

## IMMEDIATE TASKS (in order)

### 1. Verify DNS Propagation
```bash
dig teacher.ninja +short
dig www.teacher.ninja +short
```

### 2. Create EC2 Instance for API (if not using Lambda)
- Ubuntu 22.04 LTS
- t3.small or t3.medium
- Security group: HTTP (80), HTTPS (443), SSH (22)
- Attach `homebook-generator-role` IAM role
- Install: Python 3.11, nginx, certbot, docker

### 3. Set Up API DNS Record
Once EC2 is running:
```bash
aws route53 change-resource-record-sets \
  --hosted-zone-id Z04548183EDB0GCZBQSI9 \
  --change-batch '{
    "Changes": [{
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "api.teacher.ninja",
        "Type": "A",
        "TTL": 300,
        "ResourceRecords": [{"Value": "EC2_PUBLIC_IP"}]
      }
    }]
  }'
```

### 4. SSL Certificate Setup

#### For API (api.teacher.ninja) - Using Certbot
```bash
# On EC2
sudo apt update && sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d api.teacher.ninja --non-interactive --agree-tos -m admin@teacher.ninja
```

#### For Main Site - Vercel handles automatically

### 5. Create Nginx Configuration (`infra/nginx/api.conf`)
```nginx
server {
    listen 80;
    server_name api.teacher.ninja;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name api.teacher.ninja;

    ssl_certificate /etc/letsencrypt/live/api.teacher.ninja/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.teacher.ninja/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # CORS headers
    add_header Access-Control-Allow-Origin "https://teacher.ninja" always;
    add_header Access-Control-Allow-Methods "GET, POST, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Content-Type, Authorization" always;
}
```

### 6. Create Docker Compose for API (`infra/docker/docker-compose.yml`)
```yaml
version: '3.8'

services:
  generator:
    build:
      context: ../../packages/generator
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    environment:
      - AWS_REGION=us-east-1
      - S3_BUCKET_NAME=homebook-worksheets
    env_file:
      - ../../.env
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

### 7. Create Deployment Script (`infra/scripts/deploy-api.sh`)
```bash
#!/bin/bash
set -e

echo "🚀 Deploying Homebook API to api.teacher.ninja"

# Pull latest code
cd /home/ubuntu/homebook
git pull origin main

# Rebuild and restart
cd infra/docker
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Verify
sleep 5
curl -f http://localhost:8000/health || echo "⚠️ Health check failed"

echo "✅ Deployment complete"
```

### 8. Create EC2 Setup Script (`infra/scripts/setup-ec2.sh`)
```bash
#!/bin/bash
# Run on fresh Ubuntu 22.04 EC2 instance

set -e

echo "📦 Installing dependencies..."
sudo apt update && sudo apt upgrade -y
sudo apt install -y \
    python3.11 python3.11-venv python3-pip \
    nginx certbot python3-certbot-nginx \
    docker.io docker-compose \
    git curl

# Add ubuntu user to docker group
sudo usermod -aG docker ubuntu

# Clone repo
cd /home/ubuntu
git clone https://github.com/YOUR_REPO/homebook.git
cd homebook

# Create .env from secrets manager
# (The Python secrets.py handles this automatically)

echo "✅ Setup complete. Run deploy-api.sh to start the service."
```

### 9. Update S3 CORS (if API endpoint changes)
Ensure `infra/aws/s3-cors.json` includes `https://api.teacher.ninja`

### 10. Create Health Check Endpoint
Ensure the Python API has:
```python
@app.get("/health")
def health():
    return {"status": "ok", "service": "homebook-generator"}
```

## GIT RULES
- Pull before editing: `git pull`
- Commit after each task: `git add infra && git commit -m "agent/dns: [description]"`
- Push immediately: `git push`

## STATUS UPDATES
After each major task, update `scripts/agents/dns-status.md`:
- What you completed
- What you're doing next
- Any blockers

## ARCHITECTURE OVERVIEW
```
                    ┌─────────────────────────────────────┐
                    │           teacher.ninja              │
                    │         (Route53 DNS)                │
                    └───────────────┬─────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
                    ▼                               ▼
        ┌───────────────────┐           ┌───────────────────┐
        │   teacher.ninja   │           │ api.teacher.ninja │
        │      (Vercel)     │           │      (EC2)        │
        │                   │           │                   │
        │  Next.js Frontend │──────────►│  FastAPI + Python │
        │  - Generator UI   │  API      │  - Problem Gen    │
        │  - Preview        │  Calls    │  - PDF Gen        │
        │                   │           │  - S3 Upload      │
        │  SSL: Vercel Auto │           │  SSL: Let's Encrypt│
        └───────────────────┘           └─────────┬─────────┘
                                                  │
                                                  ▼
                                        ┌───────────────────┐
                                        │  S3: homebook-    │
                                        │    worksheets     │
                                        │                   │
                                        │  PDF Storage      │
                                        │  Pre-signed URLs  │
                                        └───────────────────┘
```

## ON COMPLETION
1. DNS resolves correctly for all subdomains
2. SSL certificates are valid and auto-renewing
3. Nginx is configured and running
4. Docker compose is ready for API deployment
5. All scripts are executable and documented
