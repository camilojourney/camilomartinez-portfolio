#!/bin/bash

# Backend Health Check Script

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BACKEND_URL="http://localhost:9000"

echo "🏥 Checking Backend Health..."
echo ""

# Check if server is running
if curl -s "${BACKEND_URL}/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Server is running"

    # Get health status
    RESPONSE=$(curl -s "${BACKEND_URL}/health")
    echo ""
    echo "Response:"
    echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
    echo ""

    # Check API docs
    echo -e "${GREEN}✓${NC} API Documentation: ${BACKEND_URL}/docs"
    echo -e "${GREEN}✓${NC} Alternative Docs: ${BACKEND_URL}/redoc"
else
    echo -e "${RED}✗${NC} Server is not running"
    echo ""
    echo "To start the server:"
    echo "  cd backend"
    echo "  poetry run uvicorn app.main:app --reload --port 9000"
    exit 1
fi

echo ""
echo "✨ Backend is healthy!"
