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
