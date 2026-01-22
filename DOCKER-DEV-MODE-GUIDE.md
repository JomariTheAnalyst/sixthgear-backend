# 🐳 Medusa v2 Docker Setup - DEV MODE (No Build)

## Overview

This setup runs Medusa v2 backend in **development mode** inside Docker, which means:

- ✅ **NO admin build step** (avoids Vite/Rollup errors)
- ✅ Admin UI served at runtime by Medusa dev server
- ✅ Hot reload enabled for code changes
- ✅ Redis runs in Docker
- ✅ Supabase remains external database
- ✅ Vercel storefront stays external

## Architecture

```
┌─────────────────────────────────────────┐
│         DOCKER COMPOSE                  │
│  ┌──────────────┐   ┌──────────────┐   │
│  │   Medusa     │──▶│    Redis     │   │
│  │ (dev mode)   │   │   (cache)    │   │
│  │  Port 9000   │   │  Port 6379   │   │
│  └──────┬───────┘   └──────────────┘   │
└─────────┼──────────────────────────────┘
          │
          ├──▶ Supabase Postgres (External)
          ├──▶ Cloudflare R2 (External)
          └──▶ Vercel Frontend (External)
```

---

## Prerequisites

- Docker Desktop installed and running
- Node.js 20+ (for generating secrets)
- Supabase database created
- Vercel frontend deployed

---

## Quick Start (5 Minutes)

### Step 1: Create Environment File

```bash
cd sixthgear-backend
cp .env.example .env
```

### Step 2: Generate Secrets

```bash
# Generate JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate COOKIE_SECRET (use different value)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 3: Edit .env File

Open `.env` and fill in these required values:

```env
# Supabase connection string
DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres

# Generated secrets (from Step 2)
JWT_SECRET=your_generated_jwt_secret_here
COOKIE_SECRET=your_generated_cookie_secret_here

# CORS - Add your Vercel domain
STORE_CORS=http://localhost:3000,https://yourapp.vercel.app
ADMIN_CORS=http://localhost:9000,https://your-tunnel.trycloudflare.com

# Redis (already correct for Docker)
REDIS_URL=redis://redis:6379
```

### Step 4: Start Services

```bash
docker compose up --build
```

**First run takes 2-5 minutes** to download images and install dependencies.

### Step 5: Verify Services

```bash
# Check services are running
docker compose ps

# Should show:
# sixthgear-redis   running (healthy)
# sixthgear-medusa  running (healthy)
```

---

## Access Points

| Service          | URL                            | Credentials                           |
| ---------------- | ------------------------------ | ------------------------------------- |
| **Admin UI**     | http://localhost:9000/app      | admin@medusa-test.com / supersecret   |
| **Store API**    | http://localhost:9000/store/\* | Requires x-publishable-api-key header |
| **Health Check** | http://localhost:9000/health   | No auth required                      |

---

## Verification Checklist

### ✅ 1. Health Check

```bash
curl http://localhost:9000/health
```

**Expected:** `{"status":"ok"}`

### ✅ 2. Admin UI

Open in browser: http://localhost:9000/app

**Expected:** Login page loads (not 404)

**Login:**

- Email: `admin@medusa-test.com`
- Password: `supersecret`

**After login:**

1. Change password immediately
2. Go to Settings > Publishable API Keys
3. Create new key or copy existing one (starts with `pk_`)
4. Save this key for Step 3

### ✅ 3. Store API with Publishable Key

```bash
# Replace pk_... with your actual key from Admin UI
curl http://localhost:9000/store/regions \
  -H "x-publishable-api-key: pk_your_actual_key_here"
```

**Expected:** JSON response with regions array

```json
{
  "regions": [
    {
      "id": "...",
      "name": "Philippines",
      "currency_code": "php",
      ...
    }
  ]
}
```

### ✅ 4. Redis Connection

```bash
# Check Medusa logs for Redis connection
docker compose logs medusa | grep -i redis
```

**Expected:** Should see "Redis connected" or similar message

---

## Cloudflared Tunnel Setup

### Install Cloudflared

**Windows:**

```powershell
winget install --id Cloudflare.cloudflared
```

**Mac:**

```bash
brew install cloudflared
```

**Linux:**

```bash
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb
```

### Start Tunnel

```bash
cloudflared tunnel --url http://localhost:9000
```

**Output:**

```
Your quick Tunnel has been created! Visit it at:
https://random-words-1234.trycloudflare.com
```

### Update CORS for Tunnel

1. Copy the tunnel URL from output
2. Edit `.env` and add tunnel URL to CORS:

```env
ADMIN_CORS=http://localhost:9000,https://random-words-1234.trycloudflare.com
STORE_CORS=http://localhost:3000,https://random-words-1234.trycloudflare.com,https://yourapp.vercel.app
```

3. Restart Medusa:

```bash
docker compose restart medusa
```

### Verify Tunnel

**Admin UI via tunnel:**

```
https://random-words-1234.trycloudflare.com/app
```

**Store API via tunnel:**

```bash
curl https://random-words-1234.trycloudflare.com/store/regions \
  -H "x-publishable-api-key: pk_your_key"
```

**Note:** Root path (`/`) returns "Cannot GET /" - this is normal!

---

## Connect Vercel Frontend

### Step 1: Update Vercel Environment Variables

Go to: Vercel Dashboard > Your Project > Settings > Environment Variables

Add/Update these variables for **both Production and Preview**:

```env
MEDUSA_BACKEND_URL=https://your-tunnel.trycloudflare.com
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_your_key_from_admin
NEXT_PUBLIC_DEFAULT_REGION=ph
```

### Step 2: Redeploy Frontend

```bash
# Trigger redeploy
git commit --allow-empty -m "Update backend URL"
git push
```

Or use Vercel dashboard: Deployments > Redeploy

### Step 3: Verify Frontend Connection

1. Visit your Vercel site: `https://yourapp.vercel.app`
2. Open browser DevTools > Network tab
3. Navigate to products page
4. Should see API calls to your tunnel URL
5. Calls should return 200 OK (not CORS errors)

---

## Common Commands

```bash
# Start services
docker compose up -d

# Start with logs (foreground)
docker compose up

# View logs
docker compose logs -f medusa
docker compose logs -f redis

# Restart after .env changes
docker compose restart medusa

# Stop services
docker compose down

# Rebuild from scratch
docker compose down
docker compose up --build

# Access container shell
docker compose exec medusa sh

# Run migrations manually
docker compose exec medusa pnpm medusa migrations run

# Seed database
docker compose exec medusa pnpm run seed

# Check service status
docker compose ps

# View resource usage
docker stats
```

---

## Troubleshooting

### Issue: "Publishable API key required"

**Cause:** Missing or incorrect API key

**Solution:**

1. Access Admin UI: http://localhost:9000/app
2. Login with default credentials
3. Go to Settings > Publishable API Keys
4. Create new key or copy existing
5. Use in API calls:
   ```bash
   curl http://localhost:9000/store/regions \
     -H "x-publishable-api-key: pk_your_actual_key"
   ```

### Issue: CORS Errors in Browser

**Symptoms:**

```
Access to fetch at 'http://localhost:9000/store/products' from origin
'http://localhost:3000' has been blocked by CORS policy
```

**Solution:**

1. Check `.env` includes frontend origin:
   ```env
   STORE_CORS=http://localhost:3000,https://yourapp.vercel.app
   ```
2. Restart Medusa:
   ```bash
   docker compose restart medusa
   ```
3. Clear browser cache
4. Verify CORS in logs:
   ```bash
   docker compose logs medusa | grep -i cors
   ```

### Issue: Backend Can't Connect to Redis

**Symptoms:**

```
Error: connect ECONNREFUSED 127.0.0.1:6379
Redis connection failed
```

**Solution:**

1. Check `REDIS_URL` uses service name (not localhost):
   ```env
   REDIS_URL=redis://redis:6379
   # NOT: redis://localhost:6379
   ```
2. Verify Redis is running:
   ```bash
   docker compose ps redis
   # Should show: running (healthy)
   ```
3. Test Redis connection:
   ```bash
   docker compose exec redis redis-cli ping
   # Should return: PONG
   ```
4. Restart services:
   ```bash
   docker compose restart
   ```

### Issue: Backend Can't Connect to Supabase

**Symptoms:**

```
Error: connect ETIMEDOUT
Error: password authentication failed
```

**Solutions:**

1. **Verify DATABASE_URL format:**

   ```env
   # Correct format
   DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres

   # For Supabase pooler (recommended):
   DATABASE_URL=postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
   ```

2. **Check Supabase allows connections:**
   - Supabase Dashboard > Settings > Database
   - Verify "Connection Pooling" is enabled
   - Use "Session" mode for runtime

3. **Test connection from container:**
   ```bash
   docker compose exec medusa sh
   apk add postgresql-client
   psql "$DATABASE_URL"
   ```

### Issue: Admin UI Returns 404

**Symptoms:**

```
GET /app -> 404 Not Found
GET /admin -> 404 Not Found
```

**Solutions:**

1. **Verify correct path:**
   - Medusa v2 uses `/app` (not `/admin`)
   - Try: http://localhost:9000/app

2. **Check Medusa is running in dev mode:**

   ```bash
   docker compose logs medusa | grep -i "medusa develop"
   # Should see: Running in development mode
   ```

3. **Verify container is healthy:**

   ```bash
   docker compose ps medusa
   # Health should be: healthy
   ```

4. **Check logs for errors:**
   ```bash
   docker compose logs medusa
   ```

### Issue: Port 9000 Already in Use

**Solution:**

**Option 1: Stop conflicting process**

```bash
# Windows
netstat -ano | findstr :9000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:9000 | xargs kill -9
```

**Option 2: Change port**

Edit `docker-compose.yml`:

```yaml
ports:
  - "9001:9000" # Use 9001 externally, 9000 internally
```

Then access at: http://localhost:9001/app

### Issue: "Cannot GET /" on Tunnel

**This is NORMAL!**

Medusa doesn't serve content at root path. The tunnel is working correctly.

**Working endpoints:**

- `/app` - Admin UI ✅
- `/store/regions` - Store API ✅
- `/admin/auth` - Admin API ✅

**Test:**

```bash
# Root returns 404 (expected)
curl https://your-tunnel.trycloudflare.com/
# Cannot GET /

# Admin works
curl https://your-tunnel.trycloudflare.com/app
# Returns HTML

# Store API works
curl https://your-tunnel.trycloudflare.com/store/regions \
  -H "x-publishable-api-key: pk_..."
# Returns JSON
```

### Issue: Docker Build Fails

**Common causes:**

1. **Out of disk space:**

   ```bash
   docker system prune -a
   ```

2. **Network issues:**

   ```bash
   # Retry build
   docker compose build --no-cache
   ```

3. **pnpm lock file issues:**
   ```bash
   # Regenerate lock file locally
   rm pnpm-lock.yaml
   pnpm install
   # Then rebuild
   docker compose build --no-cache
   ```

---

## Why Dev Mode (No Build)?

### The Problem with Building Admin UI

Medusa v2 Admin UI uses Vite to build a React application. This build process:

- Requires all `@medusajs/*` admin packages
- Can fail with missing dependencies
- Takes 2-5 minutes to build
- Produces cryptic Rollup/Vite errors

### The Solution: Runtime Mode

Running `medusa develop` (dev mode):

- ✅ Serves Admin UI at runtime (no build needed)
- ✅ Faster startup (no build step)
- ✅ Hot reload for code changes
- ✅ Avoids all Vite/Rollup errors
- ✅ Same functionality as built admin

### Trade-offs

**Dev Mode:**

- ✅ Faster startup
- ✅ No build errors
- ✅ Hot reload
- ⚠️ Slightly slower admin UI (not pre-built)
- ⚠️ Not recommended for production

**Production Mode (with build):**

- ✅ Faster admin UI (pre-built)
- ✅ Optimized bundle
- ⚠️ Slower startup (build time)
- ⚠️ Can fail with build errors
- ⚠️ No hot reload

**For development and testing, dev mode is perfect!**

---

## Next Steps

### 1. Enable Redis Cache (Optional)

Edit `medusa-config.ts` and uncomment:

```typescript
{
  resolve: "@medusajs/medusa/cache-redis",
  options: {
    redisUrl: process.env.REDIS_URL,
    ttl: 30,
  },
}
```

Restart: `docker compose restart medusa`

### 2. Enable Redis Event Bus (Optional)

Edit `medusa-config.ts` and uncomment:

```typescript
{
  resolve: "@medusajs/medusa/event-bus-redis",
  options: {
    redisUrl: process.env.REDIS_URL,
  },
}
```

Restart: `docker compose restart medusa`

### 3. Add Products

1. Access Admin UI: http://localhost:9000/app
2. Go to Products > Add Product
3. Fill in details and save
4. Verify on storefront

### 4. Test Storefront Integration

1. Ensure Vercel env vars are set
2. Visit storefront: https://yourapp.vercel.app
3. Navigate to products page
4. Add to cart
5. Verify no CORS errors

---

## Production Deployment

For production, you have two options:

### Option A: Keep Dev Mode (Simpler)

Use the same setup on production server:

- Faster deployment
- No build errors
- Slightly slower admin UI (acceptable for most cases)

### Option B: Build Mode (Optimized)

Create separate production Dockerfile with build step:

- Faster admin UI
- Requires fixing any build errors
- More complex setup

**Recommendation:** Start with dev mode, switch to build mode only if admin UI performance is critical.

---

## Support

If you encounter issues:

1. Check logs: `docker compose logs medusa`
2. Verify environment variables: `docker compose config`
3. Test each component individually (Redis, Supabase, Medusa)
4. Check Medusa Discord: https://discord.gg/medusajs
5. Review GitHub Issues: https://github.com/medusajs/medusa/issues

---

## Summary

✅ **What This Setup Does:**

- Runs Medusa in dev mode (no build)
- Serves Admin UI at runtime
- Uses Redis for cache/events
- Connects to Supabase database
- Exposes via Cloudflared tunnel
- Integrates with Vercel storefront

✅ **What This Setup Avoids:**

- Admin UI build errors
- Vite/Rollup compilation issues
- Missing @medusajs/\* package errors
- Long build times

✅ **Perfect For:**

- Development
- Testing
- Staging environments
- Quick deployments
- Avoiding build complexity

---

**Last Updated:** January 2025  
**Medusa Version:** 2.12.4  
**Docker Compose Version:** 3.8
