# 🚀 Docker Quick Start - TL;DR

## Prerequisites

```bash
✅ Docker Desktop installed and running
✅ Supabase database created
✅ Node.js 20+ installed
```

## Setup (5 minutes)

### 1. Create Environment File

```bash
cp .env.docker.example .env
```

### 2. Edit .env with Required Values

```env
# Supabase connection string
DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres

# Generate these (run twice for different values)
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
COOKIE_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

# Your Vercel domain
STORE_CORS=http://localhost:3000,https://yourapp.vercel.app

# Backend + tunnel URLs
ADMIN_CORS=http://localhost:9000,https://your-tunnel.trycloudflare.com

# Get from Medusa Admin after first start
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_...
```

### 3. Start Services

```bash
docker compose up -d --build
```

### 4. Check Status

```bash
docker compose ps
docker compose logs -f medusa
```

## Access Points

| Service          | URL                            | Notes                                      |
| ---------------- | ------------------------------ | ------------------------------------------ |
| **Admin UI**     | http://localhost:9000/app      | Login: admin@medusa-test.com / supersecret |
| **Store API**    | http://localhost:9000/store/\* | Requires x-publishable-api-key header      |
| **Health Check** | http://localhost:9000/health   | Should return {"status":"ok"}              |
| **Redis**        | localhost:6379                 | Internal use only                          |

## Common Commands

```bash
# Start services
docker compose up -d

# View logs
docker compose logs -f medusa

# Restart after .env changes
docker compose restart medusa

# Stop services
docker compose down

# Rebuild from scratch
docker compose build --no-cache
docker compose up -d

# Access container shell
docker compose exec medusa sh

# Run seed script
docker compose exec medusa pnpm run seed
```

## Cloudflared Tunnel (Optional)

```bash
# Install
winget install --id Cloudflare.cloudflared  # Windows
brew install cloudflared                     # Mac

# Start tunnel
cloudflared tunnel --url http://localhost:9000

# Copy the URL (e.g., https://xxx.trycloudflare.com)
# Add to .env ADMIN_CORS and STORE_CORS
# Restart: docker compose restart medusa
```

## Vercel Frontend Setup

1. Go to Vercel Dashboard > Settings > Environment Variables
2. Add these (Production + Preview):
   ```
   MEDUSA_BACKEND_URL=https://your-tunnel.trycloudflare.com
   NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_your_key
   NEXT_PUBLIC_DEFAULT_REGION=ph
   ```
3. Redeploy frontend

## Verification Tests

```bash
# Test health
curl http://localhost:9000/health

# Test Store API (replace pk_... with your key)
curl http://localhost:9000/store/regions \
  -H "x-publishable-api-key: pk_your_key"

# Test via tunnel
curl https://your-tunnel.trycloudflare.com/store/regions \
  -H "x-publishable-api-key: pk_your_key"
```

## Troubleshooting Quick Fixes

| Problem                   | Solution                                                   |
| ------------------------- | ---------------------------------------------------------- |
| Port 9000 in use          | `docker compose down` or change port in docker-compose.yml |
| Can't connect to Redis    | Check REDIS_URL=redis://redis:6379 (not localhost)         |
| Can't connect to Supabase | Verify DATABASE_URL format and Supabase allows connections |
| CORS errors               | Add origin to STORE_CORS/ADMIN_CORS, restart medusa        |
| Admin 404                 | Check http://localhost:9000/app (not /admin)               |
| Publishable key error     | Create key in Admin UI > Settings > Publishable API Keys   |

## Production Mode

```bash
# Set production environment
export BUILD_TARGET=production
export NODE_ENV=production

# Build and start
docker compose up -d --build

# Or use separate env file
docker compose --env-file .env.production up -d --build
```

## Need More Help?

See full documentation: `DOCKER-SETUP.md`
