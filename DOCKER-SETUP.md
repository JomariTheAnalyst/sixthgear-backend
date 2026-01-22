# 🐳 Medusa v2 Backend - Docker Setup Guide

Complete guide to dockerize your Medusa v2 backend with Redis, while keeping Supabase as external database.

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Quick Start](#quick-start)
4. [Environment Setup](#environment-setup)
5. [Running the Application](#running-the-application)
6. [Accessing Admin UI](#accessing-admin-ui)
7. [Cloudflared Tunnel Setup](#cloudflared-tunnel-setup)
8. [Connecting Vercel Frontend](#connecting-vercel-frontend)
9. [Production Deployment](#production-deployment)
10. [Troubleshooting](#troubleshooting)
11. [Verification Checklist](#verification-checklist)

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     DOCKER COMPOSE                          │
│  ┌──────────────────┐         ┌──────────────────┐         │
│  │  Medusa Backend  │────────▶│  Redis (Cache)   │         │
│  │  Port: 9000      │         │  Port: 6379      │         │
│  │  + Admin UI      │         │                  │         │
│  └────────┬─────────┘         └──────────────────┘         │
└───────────┼──────────────────────────────────────────────────┘
            │
            ├──────────▶ Supabase Postgres (External)
            │
            ├──────────▶ Cloudflare R2 (External - Optional)
            │
            └──────────▶ Vercel Frontend (External)
```

### Components:

- **Medusa Backend** (Docker): API + Admin UI on port 9000
- **Redis** (Docker): Cache and event bus on port 6379
- **Supabase** (External): PostgreSQL database
- **Vercel** (External): Next.js storefront
- **Cloudflared** (Optional): Temporary tunnel for external access

---

## ✅ Prerequisites

### Required:

- Docker Desktop installed and running
- Docker Compose v2.0+
- Node.js 20+ (for local dev)
- pnpm 10.15.0+ (or npm/yarn)
- Supabase account with database created
- Vercel account with frontend deployed

### Check versions:

```bash
docker --version          # Should be 20.10+
docker compose version    # Should be 2.0+
node --version           # Should be 20+
pnpm --version           # Should be 10.15.0+
```

---

## 🚀 Quick Start

### 1. Clone and Navigate

```bash
cd sixthgear-backend
```

### 2. Create Environment File

```bash
# Copy the example file
cp .env.docker.example .env

# Edit with your values
# Windows: notepad .env
# Mac/Linux: nano .env
```

### 3. Generate Secrets

```bash
# Generate JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate COOKIE_SECRET (use different value)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Start Services

```bash
# Development mode (with hot reload)
docker compose up --build

# Or run in background
docker compose up -d --build
```

### 5. Verify

```bash
# Check logs
docker compose logs -f medusa

# Check services are running
docker compose ps
```

---

## 🔧 Environment Setup

### Required Environment Variables

Edit your `.env` file with these values:

#### 1. Database (Supabase)

```env
DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres
```

**How to get:**

1. Go to Supabase Dashboard
2. Select your project
3. Settings > Database > Connection String
4. Use **Transaction** pooler for migrations
5. Use **Session** pooler for runtime (recommended)

**Example:**

```env
DATABASE_URL=postgresql://postgres.xxxxx.supabase.co:5432/postgres?pgbouncer=true
```

#### 2. Redis

```env
# For Docker (use service name)
REDIS_URL=redis://redis:6379

# For local dev without Docker
# REDIS_URL=redis://localhost:6379
```

#### 3. CORS Configuration

```env
# Storefront origins (Vercel + localhost)
STORE_CORS=http://localhost:3000,http://localhost:8000,https://yourapp.vercel.app,https://yourdomain.com

# Admin origins (backend + tunnel + localhost)
ADMIN_CORS=http://localhost:9000,http://localhost:5173,https://your-tunnel.trycloudflare.com

# Auth origins (same as admin)
AUTH_CORS=http://localhost:9000,http://localhost:5173,https://your-tunnel.trycloudflare.com
```

#### 4. Security Secrets

```env
# Generate unique 64+ character strings
JWT_SECRET=your_generated_jwt_secret_here_64_chars_minimum
COOKIE_SECRET=your_generated_cookie_secret_here_64_chars_minimum
```

#### 5. Publishable API Key

```env
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_your_key_here
```

**How to get:**

1. Start Medusa backend
2. Access Admin UI at http://localhost:9000/app
3. Login with admin credentials
4. Go to Settings > Publishable API Keys
5. Create new key or copy existing one

---

## 🏃 Running the Application

### Development Mode (Hot Reload)

```bash
# Start with logs
docker compose up --build

# Start in background
docker compose up -d --build

# View logs
docker compose logs -f medusa

# Stop services
docker compose down
```

**Features:**

- Hot reload on code changes
- Source code mounted as volume
- DevTools enabled
- Detailed error messages

### Production Mode

```bash
# Set production environment
export BUILD_TARGET=production
export NODE_ENV=production

# Or create .env.production
echo "BUILD_TARGET=production" > .env.production
echo "NODE_ENV=production" >> .env.production

# Build and start
docker compose --env-file .env.production up --build -d

# Check logs
docker compose logs -f medusa
```

**Features:**

- Optimized build
- Smaller image size
- Production dependencies only
- Security hardened

### Useful Commands

```bash
# Restart specific service
docker compose restart medusa

# Rebuild without cache
docker compose build --no-cache medusa

# View resource usage
docker stats

# Execute command in container
docker compose exec medusa pnpm run seed

# Access container shell
docker compose exec medusa sh

# Remove everything (including volumes)
docker compose down -v
```

---

## 🎨 Accessing Admin UI

### Local Access

**URL:** http://localhost:9000/app

**Default Credentials:**

- Email: `admin@medusa-test.com`
- Password: `supersecret`

**First Time Setup:**

1. Open http://localhost:9000/app
2. Login with default credentials
3. Change password immediately
4. Create publishable API key (Settings > Publishable API Keys)
5. Configure regions and currencies
6. Add products

### Verify Admin is Working

```bash
# Check admin endpoint
curl http://localhost:9000/app

# Should return HTML (not 404)
```

---

## 🌐 Cloudflared Tunnel Setup

Cloudflared provides temporary public URL for your local backend.

### Install Cloudflared

**Windows:**

```powershell
# Download from: https://github.com/cloudflare/cloudflared/releases
# Or use winget
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
# Start tunnel to Medusa backend
cloudflared tunnel --url http://localhost:9000
```

**Output:**

```
Your quick Tunnel has been created! Visit it at:
https://random-words-1234.trycloudflare.com
```

### Important Notes

1. **Root Path Returns 404** - This is normal!

   ```bash
   curl https://your-tunnel.trycloudflare.com/
   # Returns: Cannot GET /
   ```

2. **Store API Works:**

   ```bash
   curl https://your-tunnel.trycloudflare.com/store/regions \
     -H "x-publishable-api-key: pk_your_key"
   # Returns: {"regions": [...]}
   ```

3. **Admin UI Works:**
   ```
   https://your-tunnel.trycloudflare.com/app
   ```

### Update CORS for Tunnel

Add tunnel URL to `.env`:

```env
ADMIN_CORS=http://localhost:9000,https://your-tunnel.trycloudflare.com
STORE_CORS=http://localhost:3000,https://your-tunnel.trycloudflare.com,https://yourapp.vercel.app
```

Restart services:

```bash
docker compose restart medusa
```

---

## 🔗 Connecting Vercel Frontend

### 1. Update Vercel Environment Variables

Go to Vercel Dashboard > Your Project > Settings > Environment Variables

Add/Update:

```env
MEDUSA_BACKEND_URL=https://your-tunnel.trycloudflare.com
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_your_key_here
NEXT_PUBLIC_DEFAULT_REGION=ph
```

**Important:** Add to both **Production** and **Preview** environments.

### 2. Redeploy Frontend

```bash
# Trigger redeploy
git commit --allow-empty -m "Update backend URL"
git push

# Or use Vercel CLI
vercel --prod
```

### 3. Verify Connection

```bash
# Test from Vercel domain
curl https://yourapp.vercel.app/api/test

# Check browser console for API calls
# Should see requests to your tunnel URL
```

### 4. Update Backend CORS

Ensure Vercel domain is in STORE_CORS:

```env
STORE_CORS=https://yourapp.vercel.app,https://yourdomain.com,http://localhost:3000
```

---

## 🚢 Production Deployment

### Option 1: VPS with Docker

**Recommended for:** Full control, cost-effective

1. **Provision VPS** (DigitalOcean, Linode, AWS EC2)
   - Ubuntu 22.04 LTS
   - 2GB RAM minimum
   - Docker installed

2. **Clone Repository**

   ```bash
   git clone your-repo
   cd sixthgear-backend
   ```

3. **Setup Environment**

   ```bash
   cp .env.docker.example .env
   nano .env
   # Fill in production values
   ```

4. **Run Production Build**

   ```bash
   export BUILD_TARGET=production
   export NODE_ENV=production
   docker compose up -d --build
   ```

5. **Setup Reverse Proxy (Nginx)**

   ```nginx
   server {
       listen 80;
       server_name api.yourdomain.com;

       location / {
           proxy_pass http://localhost:9000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

6. **Setup SSL (Let's Encrypt)**
   ```bash
   sudo certbot --nginx -d api.yourdomain.com
   ```

### Option 2: Railway

**Recommended for:** Quick deployment, managed infrastructure

1. **Install Railway CLI**

   ```bash
   npm install -g @railway/cli
   ```

2. **Login and Initialize**

   ```bash
   railway login
   railway init
   ```

3. **Add Services**

   ```bash
   # Add Redis
   railway add redis

   # Deploy backend
   railway up
   ```

4. **Set Environment Variables**
   ```bash
   railway variables set DATABASE_URL="your_supabase_url"
   railway variables set JWT_SECRET="your_secret"
   # ... add all required vars
   ```

### Option 3: Render

**Recommended for:** Simple deployment, free tier available

1. **Create render.yaml** (already exists in your repo)

2. **Connect Repository**
   - Go to Render Dashboard
   - New > Blueprint
   - Connect your GitHub repo

3. **Configure Environment**
   - Add all environment variables
   - Set build command: `docker build -t medusa .`
   - Set start command: `docker run -p 9000:9000 medusa`

---

## 🔍 Troubleshooting

### Issue: "Publishable API key required"

**Cause:** Missing or incorrect API key header

**Solution:**

```bash
# Verify key exists in Medusa Admin
# Settings > Publishable API Keys

# Test with curl
curl http://localhost:9000/store/regions \
  -H "x-publishable-api-key: pk_your_actual_key"

# Update frontend .env
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_your_actual_key
```

### Issue: CORS Errors in Browser

**Symptoms:**

```
Access to fetch at 'http://localhost:9000/store/products' from origin
'http://localhost:3000' has been blocked by CORS policy
```

**Solution:**

```bash
# 1. Check STORE_CORS includes frontend origin
STORE_CORS=http://localhost:3000,https://yourapp.vercel.app

# 2. Restart backend
docker compose restart medusa

# 3. Clear browser cache
# 4. Check browser console for actual origin
```

### Issue: Backend Can't Connect to Supabase

**Symptoms:**

```
Error: connect ETIMEDOUT
Error: password authentication failed
```

**Solutions:**

1. **Check DATABASE_URL format:**

   ```env
   # Correct format
   DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres

   # Common mistakes:
   # - Missing password
   # - Wrong port (should be 5432 or 6543 for pooler)
   # - Missing ?pgbouncer=true for pooler
   ```

2. **Verify Supabase allows connections:**
   - Supabase Dashboard > Settings > Database
   - Check "Connection Pooling" is enabled
   - Use "Session" mode for runtime

3. **Test connection:**
   ```bash
   docker compose exec medusa sh
   apk add postgresql-client
   psql "$DATABASE_URL"
   ```

### Issue: Backend Can't Connect to Redis

**Symptoms:**

```
Error: connect ECONNREFUSED 127.0.0.1:6379
Redis connection failed
```

**Solution:**

```bash
# 1. Check REDIS_URL uses service name (not localhost)
REDIS_URL=redis://redis:6379

# NOT: redis://localhost:6379 (wrong in Docker)

# 2. Verify Redis is running
docker compose ps redis

# 3. Check Redis health
docker compose exec redis redis-cli ping
# Should return: PONG

# 4. Restart services
docker compose restart
```

### Issue: Medusa Admin Not Found (404)

**Symptoms:**

```
GET /app -> 404 Not Found
GET /admin -> 404 Not Found
```

**Solutions:**

1. **Check admin path configuration:**

   ```env
   # In .env
   MEDUSA_ADMIN_PATH=/app
   ```

2. **Verify build includes admin:**

   ```bash
   docker compose exec medusa ls -la dist
   # Should see admin files
   ```

3. **Check Medusa version:**

   ```bash
   # Admin UI is built-in for Medusa v2
   docker compose exec medusa pnpm list @medusajs/admin-sdk
   ```

4. **Rebuild without cache:**
   ```bash
   docker compose build --no-cache medusa
   docker compose up -d
   ```

### Issue: Cloudflared Shows "Cannot GET /"

**This is NORMAL!**

Medusa doesn't serve content at root path. Try:

- `/app` - Admin UI
- `/store/regions` - Store API
- `/admin/auth` - Admin API

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

### Issue: "Port 9000 already in use"

**Solution:**

```bash
# Find process using port
# Windows:
netstat -ano | findstr :9000
taskkill /PID <PID> /F

# Mac/Linux:
lsof -ti:9000 | xargs kill -9

# Or change port in docker-compose.yml
ports:
  - "9001:9000"  # Use 9001 externally
```

### Issue: Docker Build Fails

**Common causes:**

1. **Out of disk space:**

   ```bash
   docker system prune -a
   ```

2. **Network issues:**

   ```bash
   # Use different registry
   docker pull node:20-alpine
   ```

3. **pnpm lock file issues:**
   ```bash
   # Regenerate lock file
   rm pnpm-lock.yaml
   pnpm install
   ```

---

## ✅ Verification Checklist

### Local Development

- [ ] Docker services start without errors

  ```bash
  docker compose ps
  # All services should be "Up" and "healthy"
  ```

- [ ] Redis is connected

  ```bash
  docker compose logs medusa | grep -i redis
  # Should see: "Redis connected"
  ```

- [ ] Database migrations ran

  ```bash
  docker compose logs medusa | grep -i migration
  # Should see: "Migrations completed"
  ```

- [ ] Backend responds to health check

  ```bash
  curl http://localhost:9000/health
  # Should return: {"status":"ok"}
  ```

- [ ] Store API works with publishable key

  ```bash
  curl http://localhost:9000/store/regions \
    -H "x-publishable-api-key: pk_your_key"
  # Should return: {"regions":[...]}
  ```

- [ ] Admin UI loads

  ```
  Open: http://localhost:9000/app
  Should see: Login page
  ```

- [ ] Admin login works
  ```
  Email: admin@medusa-test.com
  Password: supersecret
  Should: Redirect to dashboard
  ```

### Cloudflared Tunnel

- [ ] Tunnel starts and provides URL

  ```bash
  cloudflared tunnel --url http://localhost:9000
  # Should output: https://xxx.trycloudflare.com
  ```

- [ ] Store API accessible via tunnel

  ```bash
  curl https://your-tunnel.trycloudflare.com/store/regions \
    -H "x-publishable-api-key: pk_your_key"
  ```

- [ ] Admin UI accessible via tunnel

  ```
  Open: https://your-tunnel.trycloudflare.com/app
  ```

- [ ] CORS configured for tunnel
  ```env
  ADMIN_CORS includes tunnel URL
  STORE_CORS includes tunnel URL
  ```

### Vercel Frontend Connection

- [ ] Environment variables set in Vercel

  ```
  MEDUSA_BACKEND_URL=https://your-tunnel.trycloudflare.com
  NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_...
  ```

- [ ] Frontend deployed with new env vars

  ```bash
  # Check Vercel deployment logs
  ```

- [ ] Frontend can fetch regions

  ```
  Open browser console on Vercel site
  Check Network tab for /store/regions call
  Should return 200 OK
  ```

- [ ] Products load on storefront

  ```
  Visit: https://yourapp.vercel.app/ph/products
  Should: Display products
  ```

- [ ] Cart functionality works
  ```
  Add product to cart
  Should: No CORS errors
  ```

### Production Readiness

- [ ] Secrets are strong (64+ chars)

  ```bash
  echo $JWT_SECRET | wc -c
  # Should be > 64
  ```

- [ ] .env is in .gitignore

  ```bash
  git status
  # .env should NOT appear
  ```

- [ ] Production build works

  ```bash
  BUILD_TARGET=production docker compose up --build
  ```

- [ ] Health checks pass

  ```bash
  docker compose ps
  # Health should be "healthy"
  ```

- [ ] Logs show no errors
  ```bash
  docker compose logs medusa | grep -i error
  # Should be minimal/none
  ```

---

## 📚 Additional Resources

### Documentation

- [Medusa v2 Docs](https://docs.medusajs.com)
- [Docker Compose Docs](https://docs.docker.com/compose/)
- [Supabase Docs](https://supabase.com/docs)
- [Cloudflared Docs](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps)

### Useful Commands Reference

```bash
# Docker Compose
docker compose up -d              # Start in background
docker compose down               # Stop services
docker compose logs -f medusa     # Follow logs
docker compose restart medusa     # Restart service
docker compose exec medusa sh     # Access shell
docker compose ps                 # List services
docker compose build --no-cache   # Rebuild from scratch

# Docker
docker ps                         # List containers
docker images                     # List images
docker system prune -a            # Clean up everything
docker stats                      # Resource usage

# Medusa
pnpm run dev                      # Development mode
pnpm run build                    # Build for production
pnpm run start                    # Start production
pnpm run seed                     # Seed database

# Generate secrets
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 🎯 Next Steps

1. **Enable Redis Cache** (Optional)
   - Uncomment cache module in `medusa-config.ts`
   - Restart services
   - Verify faster API responses

2. **Enable Redis Event Bus** (Optional)
   - Uncomment event bus module in `medusa-config.ts`
   - Restart services
   - Verify async events work

3. **Setup Monitoring**
   - Add health check endpoints
   - Setup uptime monitoring (UptimeRobot, Pingdom)
   - Configure log aggregation

4. **Optimize Performance**
   - Enable Redis cache
   - Configure CDN for static assets
   - Optimize database queries

5. **Security Hardening**
   - Rotate secrets regularly
   - Enable rate limiting
   - Setup firewall rules
   - Use secrets manager (AWS Secrets Manager, Vault)

---

## 🆘 Support

If you encounter issues not covered in this guide:

1. Check Medusa Discord: https://discord.gg/medusajs
2. Review GitHub Issues: https://github.com/medusajs/medusa/issues
3. Check Docker logs: `docker compose logs -f`
4. Verify environment variables: `docker compose config`

---

**Last Updated:** January 2025
**Medusa Version:** 2.12.4
**Docker Compose Version:** 3.8
