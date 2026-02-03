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
