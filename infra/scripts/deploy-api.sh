#!/bin/bash
# Deployment script for Homebook API (api.teacher.ninja)
# Usage: bash deploy-api.sh

set -euo pipefail

PROJECT_DIR="/home/ubuntu/homebook"
DOCKER_DIR="$PROJECT_DIR/infra/docker"

echo "=== Deploying Homebook API ==="

# Pull latest code
echo "[1/4] Pulling latest code..."
cd "$PROJECT_DIR"
git pull origin main

# Build and restart containers
echo "[2/4] Building and restarting containers..."
cd "$DOCKER_DIR"
docker compose down
docker compose build --no-cache
docker compose up -d

# Wait for service to start
echo "[3/4] Waiting for service to start..."
sleep 10

# Health check
echo "[4/4] Running health check..."
MAX_RETRIES=5
RETRY_COUNT=0
until curl -sf http://localhost:8000/health > /dev/null 2>&1; do
    RETRY_COUNT=$((RETRY_COUNT + 1))
    if [ "$RETRY_COUNT" -ge "$MAX_RETRIES" ]; then
        echo "ERROR: Health check failed after $MAX_RETRIES attempts"
        echo "Check logs: docker compose -f $DOCKER_DIR/docker-compose.yml logs"
        exit 1
    fi
    echo "  Retry $RETRY_COUNT/$MAX_RETRIES..."
    sleep 5
done

echo ""
echo "=== Deployment Complete ==="
echo "API is running at https://api.teacher.ninja"
echo "Health: $(curl -s http://localhost:8000/health)"
