#!/bin/bash

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🚀 Starting full-stack development environment...${NC}"

# Start backend
echo -e "${YELLOW}📦 Starting backend (uv + uvicorn on port 8000)...${NC}"
cd backend
uv sync > /dev/null 2>&1
uv run uvicorn app.main:app --reload --port 8000 &
BACKEND_PID=$!

# Wait for backend to be ready
echo -e "${YELLOW}⏳ Waiting for backend to start...${NC}"
for i in {1..30}; do
  if curl -s http://localhost:8000/docs > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend is ready!${NC}"
    break
  fi
  if [ $i -eq 30 ]; then
    echo -e "${RED}✗ Backend failed to start${NC}"
    kill $BACKEND_PID
    exit 1
  fi
  echo -n "."
  sleep 1
done

# Go back to root
cd ..

# Start frontend
echo -e "${YELLOW}🎨 Starting frontend (Next.js on port 3000)...${NC}"
next dev &
FRONTEND_PID=$!

# Handle shutdown
trap "kill $BACKEND_PID $FRONTEND_PID" EXIT

echo -e "${GREEN}✓ Development environment ready!${NC}"
echo -e "${GREEN}  Frontend:  http://localhost:3000${NC}"
echo -e "${GREEN}  Backend:   http://localhost:8000${NC}"
echo -e "${GREEN}  API Docs:  http://localhost:8000/docs${NC}"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"

wait
