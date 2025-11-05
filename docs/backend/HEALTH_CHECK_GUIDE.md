# Professional Backend Health Check Guide

Complete guide for monitoring and testing your FastAPI backend like a pro.

---

## 🎯 Quick Comparison

| Tool | Best For | Skill Level | Free |
|------|----------|-------------|------|
| **Postman** | API Development & Testing | Beginner-Pro | Yes |
| **Thunder Client** | Quick tests in VS Code | Beginner | Yes |
| **HTTPie** | Beautiful CLI testing | Intermediate | Yes |
| **curl** | Simple quick checks | Beginner | Yes |
| **Python Script** | Automated monitoring | Intermediate | Yes |
| **Insomnia** | Postman alternative | Beginner-Pro | Yes |

---

## 1️⃣ Postman (Industry Standard)

### Why Postman?
- ✅ Most popular API testing tool
- ✅ Save and organize requests
- ✅ Share collections with team
- ✅ Automated testing
- ✅ Environment management (dev/staging/prod)

### Setup

1. **Download Postman**
   - Go to: https://www.postman.com/downloads/
   - Install for macOS

2. **Create Collection**
   - Open Postman
   - Click "New Collection"
   - Name it: "Camilo Backend API"

3. **Add Health Check Request**
   ```
   Method: GET
   URL: http://localhost:9000/health
   ```

4. **Test Other Endpoints**
   ```
   GET  http://localhost:9000/docs
   GET  http://localhost:9000/openapi.json
   GET  http://localhost:9000/api/ai/query
   POST http://localhost:9000/api/integrations/whoop/sync
   ```

### Advanced: Create Tests

In Postman, go to "Tests" tab and add:

```javascript
// Test 1: Status code is 200
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

// Test 2: Response time is less than 500ms
pm.test("Response time is less than 500ms", function () {
    pm.expect(pm.response.responseTime).to.be.below(500);
});

// Test 3: Response has correct structure
pm.test("Response has status field", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('status');
    pm.expect(jsonData.status).to.eql('healthy');
});
```

### Export Collection

Save this as a file to share with team:
1. Right-click collection → Export
2. Choose "Collection v2.1"
3. Save to `docs/backend/postman/`

---

## 2️⃣ Thunder Client (VS Code Built-in)

### Why Thunder Client?
- ✅ No separate app needed
- ✅ Lightweight
- ✅ Integrated with VS Code
- ✅ Free

### Setup

1. **Install Extension**
   - Open VS Code
   - Go to Extensions (⌘+Shift+X)
   - Search "Thunder Client"
   - Click Install

2. **Create Request**
   - Click Thunder Client icon in sidebar
   - Click "New Request"
   - Method: GET
   - URL: `http://localhost:9000/health`
   - Click "Send"

3. **Save to Collection**
   - Click "Save"
   - Name: "Backend Health Check"
   - Add to new collection: "Camilo Backend"

---

## 3️⃣ HTTPie (Beautiful CLI)

### Why HTTPie?
- ✅ Prettier than curl
- ✅ Syntax highlighting
- ✅ Great for terminal workflows

### Install

```bash
brew install httpie
```

### Usage

```bash
# Basic health check
http GET localhost:9000/health

# With headers
http GET localhost:9000/health User-Agent:MyApp/1.0

# POST request with JSON
http POST localhost:9000/api/endpoint \
  key=value \
  another_key=another_value

# Download response
http GET localhost:9000/health > response.json

# Pretty print JSON
http GET localhost:9000/health | jq
```

---

## 4️⃣ Professional Python Script

### Why Python Script?
- ✅ Automated monitoring
- ✅ Multiple endpoints at once
- ✅ CI/CD integration
- ✅ Response time tracking

### Run the Script

```bash
cd backend
poetry run python scripts/health-check.py
```

### Output Example

```
============================================================
  🏥 Backend Health Check Report
  2025-10-27 14:30:00
============================================================

✓ PASS Server Health
  Status: 200
  Response Time: 45.23ms
  Response: {
    "status": "healthy",
    "version": "0.1.0"
  }

✓ PASS API Documentation
  Status: 200
  Response Time: 12.45ms

✓ PASS OpenAPI Schema
  Status: 200
  Response Time: 8.91ms

============================================================
Summary:
  Total Checks: 3
  Passed: 3
  Failed: 0

✨ All checks passed! Backend is healthy.
```

### Automate with Cron

Run health checks every hour:

```bash
# Edit crontab
crontab -e

# Add this line
0 * * * * cd /path/to/backend && poetry run python scripts/health-check.py >> /tmp/backend-health.log 2>&1
```

---

## 5️⃣ curl (Quick & Simple)

### Why curl?
- ✅ Available everywhere
- ✅ No installation needed
- ✅ Works in any terminal

### Usage

```bash
# Basic health check
curl http://localhost:9000/health

# Pretty print JSON
curl http://localhost:9000/health | jq

# Show response headers
curl -i http://localhost:9000/health

# Show timing information
curl -w "\nTime: %{time_total}s\n" http://localhost:9000/health

# Save to file
curl http://localhost:9000/health -o health.json

# Silent mode (only show errors)
curl -sf http://localhost:9000/health || echo "Backend is down!"
```

---

## 6️⃣ Production Monitoring Tools

### For Production Deployments

#### **Uptime Monitoring**
- [UptimeRobot](https://uptimerobot.com/) - Free ping monitoring
- [Pingdom](https://www.pingdom.com/) - Professional monitoring
- [Better Uptime](https://betteruptime.com/) - Modern monitoring

#### **Application Performance Monitoring (APM)**
- [Sentry](https://sentry.io/) - Error tracking
- [Datadog](https://www.datadoghq.com/) - Full observability
- [New Relic](https://newrelic.com/) - Performance monitoring

#### **Health Check from Vercel**

Add to your `vercel.json`:

```json
{
  "functions": {
    "backend/app/main.py": {
      "memory": 1024,
      "maxDuration": 10
    }
  },
  "crons": [
    {
      "path": "/api/health-check",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

---

## 🎯 Recommended Setup for You

### Daily Development
1. **Thunder Client** (in VS Code) - Quick tests while coding
2. **Browser** - Visual check at http://localhost:9000/docs

### Testing & QA
1. **Postman** - Comprehensive API testing
2. **Python Script** - Automated checks before deployment

### Production
1. **UptimeRobot** - 24/7 monitoring
2. **Sentry** - Error tracking
3. **Vercel cron** - Regular health checks

---

## 📋 Health Check Checklist

### What to Check

- [ ] **Server responds** - GET /health returns 200
- [ ] **Response time** - < 500ms for health check
- [ ] **Database connected** - Health check includes DB status
- [ ] **Redis connected** - Cache is accessible
- [ ] **API docs load** - /docs returns 200
- [ ] **OpenAPI schema valid** - /openapi.json is valid
- [ ] **Authentication works** - Test with valid token
- [ ] **Rate limiting active** - Check headers
- [ ] **CORS configured** - Frontend can access
- [ ] **Error handling** - Test invalid endpoints return proper errors

---

## 🚀 Quick Commands

```bash
# Simple check
curl http://localhost:9000/health

# Professional check
cd backend && poetry run python scripts/health-check.py

# HTTPie check
http GET localhost:9000/health

# Check with timing
curl -w "\nTime: %{time_total}s\n" http://localhost:9000/health

# Check from frontend
curl http://localhost:3000/api/health
```

---

## 📚 Additional Resources

- [Postman Learning Center](https://learning.postman.com/)
- [HTTPie Documentation](https://httpie.io/docs)
- [FastAPI Testing Guide](https://fastapi.tiangolo.com/tutorial/testing/)
- [Monitoring Best Practices](https://www.datadoghq.com/blog/monitoring-101-collecting-data/)

---

**TL;DR**: Use **Thunder Client** in VS Code for quick tests, **Postman** for comprehensive testing, and the **Python script** for automated monitoring. 🚀
