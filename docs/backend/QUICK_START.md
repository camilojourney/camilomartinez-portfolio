# Backend Quick Start

**TL;DR**: How to run the FastAPI backend in 30 seconds.

## ⚡ Super Quick Start

```bash
# Navigate to backend
cd backend/

# Start the server (Poetry and dependencies already installed)
poetry run uvicorn app.main:app --reload --host 0.0.0.0 --port 9000
```

**Backend will run at**: http://localhost:9000
**API Docs**: http://localhost:9000/docs

---

## 🚀 First Time Setup

### 1. Install Poetry (one time only)
```bash
curl -sSL https://install.python-poetry.org | python3 -
```

### 2. Add Poetry to PATH
Add to your `~/.zshrc` or `~/.bashrc`:
```bash
export PATH="/Users/camilomartinez/.local/bin:$PATH"
```

Then reload:
```bash
source ~/.zshrc
```

### 3. Install Dependencies
```bash
cd backend/
poetry install
```

### 4. Set Up Environment
The `.env` file is already created with your credentials from the main project.

### 5. Run Migrations (if needed)
```bash
poetry run alembic upgrade head
```

### 6. Start Server
```bash
poetry run uvicorn app.main:app --reload --host 0.0.0.0 --port 9000
```

---

## 📋 Common Commands

```bash
# Start development server
poetry run uvicorn app.main:app --reload --port 9000

# Or activate poetry shell first
poetry shell
uvicorn app.main:app --reload --port 9000

# Run database migrations
poetry run alembic upgrade head

# Run tests
poetry run pytest

# Format code
poetry run black app/

# Lint code
poetry run ruff check app/
```

---

## 🌐 Access Points

Once running:
- **API**: http://localhost:9000
- **Interactive Docs (Swagger)**: http://localhost:9000/docs
- **Alternative Docs (ReDoc)**: http://localhost:9000/redoc
- **Health Check**: http://localhost:9000/health

## 🏥 Check Backend Health

### Quick Check (Browser)
Open: http://localhost:9000/health

### Quick Check (Command Line)
```bash
curl http://localhost:9000/health
```

### Using Health Check Script
```bash
cd backend
./check-health.sh
```

You should see:
```json
{
  "status": "healthy",
  "version": "0.1.0",
  "timestamp": "2025-10-27T..."
}
```

---

## 🔧 Environment Variables

Your backend uses environment variables from `backend/.env`:
- `DATABASE_URL` - Neon Postgres connection
- `REDIS_URL` - Redis for caching/rate limiting
- `OPENAI_API_KEY` - OpenAI API
- `STRAVA_CLIENT_ID` & `STRAVA_CLIENT_SECRET`
- `WHOOP_CLIENT_ID` & `WHOOP_CLIENT_SECRET`
- Plus auth and security settings

All values are automatically synced from your main project's `.env.local`.

---

## 🐛 Troubleshooting

### "poetry: command not found"
```bash
# Add to PATH
export PATH="/Users/camilomartinez/.local/bin:$PATH"

# Or use full path
/Users/camilomartinez/.local/bin/poetry run uvicorn app.main:app --reload --port 9000
```

### "Python version not compatible"
```bash
# Use Python 3.12
poetry env use python3.12
poetry install
```

### "Database connection error"
Check your `DATABASE_URL` in `backend/.env` - it should match your Neon database from the main `.env.local`.

### "Redis connection error"
```bash
# Start Redis locally
redis-server

# Or use Docker
docker run -d -p 6379:6379 redis:7

# Or comment out Redis in code if not needed for basic testing
```

---

## 🎯 Most Important Commands

| Command | What It Does |
|---------|-------------|
| `cd backend && poetry run uvicorn app.main:app --reload --port 9000` | Start backend |
| `poetry shell` | Activate virtual environment |
| `poetry run alembic upgrade head` | Run migrations |
| `poetry run pytest` | Run tests |

---

## 📚 More Info

- [Full Developer Guide](./DEVELOPER_GUIDE.md) - Detailed setup and architecture
- [Architecture Overview](./README.md) - System design and structure
- [Professional Health Check Guide](./HEALTH_CHECK_GUIDE.md) - Postman, HTTPie, monitoring tools
- [API Documentation](http://localhost:9000/docs) - Interactive API docs (when running)

---

**TL;DR**: Just run `cd backend && poetry run uvicorn app.main:app --reload --port 9000` 🚀
