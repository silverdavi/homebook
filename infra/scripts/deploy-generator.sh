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
