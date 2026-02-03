# Infrastructure Agent - Homebook (teacher.ninja)

> Session: homebook-infra-001
> Budget: $20

## YOUR OWNERSHIP
You exclusively own:
- `infra/docker/`
- `infra/scripts/`
- Root config files: `docker-compose.yml`, `Dockerfile`
- `packages/generator/Dockerfile`
- `packages/generator/requirements.txt` (verify/update)

## DO NOT TOUCH
- `apps/` (Frontend/Backend)
- `packages/generator/src/` (Generator Agent)
- `infra/aws/` (already configured)
- `infra/dns/` (DNS Agent)

## YOUR MISSION
Create Docker configuration and deployment scripts for the Python generator service.

---

## PHASE 1: Generator Dockerfile

### Task 1.1: Create packages/generator/Dockerfile

```dockerfile
FROM python:3.11-slim

# WeasyPrint dependencies
RUN apt-get update && apt-get install -y \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libgdk-pixbuf2.0-0 \
    libffi-dev \
    shared-mime-info \
    fonts-liberation \
    fonts-dejavu-core \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY src/ ./src/
COPY templates/ ./templates/

# Create non-root user
RUN useradd -m appuser && chown -R appuser:appuser /app
USER appuser

# Run FastAPI
EXPOSE 8000
CMD ["uvicorn", "src.api.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Task 1.2: Verify requirements.txt

```
fastapi==0.109.0
uvicorn[standard]==0.27.0
pydantic==2.5.3
jinja2==3.1.3
weasyprint==60.2
boto3==1.34.25
python-dotenv==1.0.0
pytest==7.4.4
httpx==0.26.0
openai==1.10.0
google-generativeai==0.3.2
```

---

## PHASE 2: Docker Compose

### Task 2.1: Create infra/docker/docker-compose.yml

```yaml
version: '3.8'

services:
  generator:
    build:
      context: ../../packages/generator
      dockerfile: Dockerfile
    container_name: homebook-generator
    ports:
      - "8000:8000"
    environment:
      - NODE_ENV=production
      - AWS_REGION=us-east-1
      - S3_BUCKET_NAME=homebook-worksheets
    env_file:
      - ../../.env
    volumes:
      - generator-cache:/app/.cache
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

volumes:
  generator-cache:
```

### Task 2.2: Create infra/docker/docker-compose.dev.yml

```yaml
version: '3.8'

services:
  generator:
    build:
      context: ../../packages/generator
      dockerfile: Dockerfile
    container_name: homebook-generator-dev
    ports:
      - "8000:8000"
    environment:
      - NODE_ENV=development
      - USE_ENV_SECRETS=true
    env_file:
      - ../../.env
    volumes:
      # Mount source for hot reload
      - ../../packages/generator/src:/app/src:ro
      - ../../packages/generator/templates:/app/templates:ro
    command: uvicorn src.api.main:app --host 0.0.0.0 --port 8000 --reload
```

---

## PHASE 3: Deployment Scripts

### Task 3.1: Create infra/scripts/deploy-generator.sh

```bash
#!/bin/bash
set -e

echo "🚀 Deploying Homebook Generator"
echo "================================"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
DOCKER_DIR="$PROJECT_ROOT/infra/docker"

cd "$DOCKER_DIR"

echo "📦 Pulling latest code..."
cd "$PROJECT_ROOT"
git pull origin main

echo "🔨 Building Docker image..."
cd "$DOCKER_DIR"
docker-compose build --no-cache generator

echo "🔄 Restarting service..."
docker-compose down
docker-compose up -d

echo "⏳ Waiting for health check..."
sleep 10

# Health check
if curl -sf http://localhost:8000/health > /dev/null; then
    echo "✅ Generator is healthy!"
    docker-compose logs --tail=20 generator
else
    echo "❌ Health check failed!"
    docker-compose logs generator
    exit 1
fi

echo ""
echo "✅ Deployment complete!"
echo "   Service: http://localhost:8000"
echo "   Health:  http://localhost:8000/health"
```

### Task 3.2: Create infra/scripts/dev-start.sh

```bash
#!/bin/bash
# Start development environment

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "🏠 Starting Homebook Development Environment"
echo "============================================"

# Start generator in background
echo "🐍 Starting Python generator..."
cd "$PROJECT_ROOT/infra/docker"
docker-compose -f docker-compose.dev.yml up -d

# Wait for it
sleep 5

# Check health
if curl -sf http://localhost:8000/health > /dev/null; then
    echo "✅ Generator running at http://localhost:8000"
else
    echo "⚠️  Generator may still be starting..."
fi

# Start Next.js
echo "⚛️  Starting Next.js frontend..."
cd "$PROJECT_ROOT/apps/web"
npm run dev &

echo ""
echo "🎉 Development environment ready!"
echo "   Frontend: http://localhost:3000"
echo "   API:      http://localhost:8000"
echo ""
echo "   Logs: docker-compose -f infra/docker/docker-compose.dev.yml logs -f"
```

### Task 3.3: Create infra/scripts/stop-dev.sh

```bash
#!/bin/bash
# Stop development environment

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "Stopping development environment..."

# Stop Docker
cd "$PROJECT_ROOT/infra/docker"
docker-compose -f docker-compose.dev.yml down

# Kill Next.js (if running)
pkill -f "next dev" 2>/dev/null || true

echo "✅ Development environment stopped"
```

### Task 3.4: Create infra/scripts/logs.sh

```bash
#!/bin/bash
# View generator logs

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/../docker"

docker-compose logs -f generator
```

---

## PHASE 4: EC2 Setup Script

### Task 4.1: Create infra/scripts/setup-ec2.sh

```bash
#!/bin/bash
# Run on fresh Ubuntu 22.04 EC2 instance
# Usage: curl -sSL https://raw.githubusercontent.com/.../setup-ec2.sh | bash

set -e

echo "🖥️  Setting up Homebook EC2 Instance"
echo "====================================="

# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
echo "📦 Installing Docker..."
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker ubuntu

# Install Docker Compose
echo "📦 Installing Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Nginx
echo "📦 Installing Nginx..."
sudo apt install -y nginx

# Install Certbot
echo "📦 Installing Certbot..."
sudo apt install -y certbot python3-certbot-nginx

# Install AWS CLI
echo "📦 Installing AWS CLI..."
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip -q awscliv2.zip
sudo ./aws/install
rm -rf awscliv2.zip aws/

# Install Git
sudo apt install -y git

# Create app directory
sudo mkdir -p /opt/homebook
sudo chown ubuntu:ubuntu /opt/homebook

echo ""
echo "✅ EC2 setup complete!"
echo ""
echo "Next steps:"
echo "  1. Clone repository: git clone <repo> /opt/homebook"
echo "  2. Copy .env file"
echo "  3. Run: cd /opt/homebook && ./infra/scripts/deploy-generator.sh"
echo "  4. Configure nginx: sudo cp /opt/homebook/infra/nginx/api.conf /etc/nginx/sites-available/"
echo "  5. Get SSL cert: sudo certbot --nginx -d api.teacher.ninja"
```

---

## PHASE 5: Make Scripts Executable

```bash
chmod +x infra/scripts/*.sh
```

---

## GIT RULES
- Commit after each script: `git add infra && git commit -m "agent/infra: add [script]"`
- Push after each phase

## STATUS UPDATES
Update `scripts/agents/infra-status.md`

## REMEMBER
- All scripts should be idempotent (safe to run multiple times)
- Include error handling with `set -e`
- Add helpful output messages
- Test Docker builds locally before deploying
