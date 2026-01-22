# 🚀 Docker Quick Reference

## Setup (First Time)

```bash
# 1. Create .env file
cp .env.example .env

# 2. Generate secrets
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"  # JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"  # COOKIE_SECRET

# 3. Edit .env with your values
# - DATABASE_URL (Supabase)
# - JWT_SECRET and COOKIE_SECRET (from step 2)
# - STORE_CORS (add Vercel domain)
# - ADMIN_CORS (add tunnel URL)

# 4. Start services
docker compose up --build
```

## Daily Commands

```bash
# Start services (background)
docker compose up -d

# Start services (with logs)
docker compose up

# Stop services
docker compose down

# Restart after .env changes
docker compose restart medusa

# View logs
docker compose logs -f medusa

# Check status
docker compose ps
```

## Access Points

| Service | URL |
|---------|-----|
| Admin UI | http://localhost:9000/app |
| Store API | http://localhost:9000/store/* |
| Health | http://localhost:9000/health |

**Default Login:** admin@medusa-test.com / supersecret

## Verification Tests

```bash
# Health check
curl http://localhost:9000/health

# Store API (replace pk_... with your key)
curl http://localhost:9000/store/regions \
  -H "x-publishable-api-key: pk_your_key"

# Check Redis
docker compose exec redis redis-cli ping
```

## Cloudflared Tunnel

```bash
# Start tunnel
cloudflared tunnel --url http://localhost:9000

# Copy URL from output, add to .env:
# ADMIN_CORS=http://localhost:9000,https://your-tunnel.trycloudflare.com
# STORE_CORS=http://localhost:3000,https://your-tunnel.trycloudflare.com

# Restart
docker compose restart medusa
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Port 9000 in use | `docker compose down` or change port |
| Can't connect to Redis | Check `REDIS_URL=redis://redis:6379` |
| Can't connect to Supabase | Verify `DATABASE_URL` format |
| CORS errors | Add origin to CORS vars, restart |
| Admin 404 | Use `/app` not `/admin` |
| Publishable key error | Create in Admin UI > Settings |

## Useful Commands

```bash
# Rebuild from scratch
docker compose down
docker compose up --build

# Access container shell
docker compose exec medusa sh

# Run migrations
docker compose exec medusa pnpm medusa migrations run

# Seed database
docker compose exec medusa pnpm run seed

# View resource usage
docker stats

# Clean up Docker
docker system prune -a
```

## Vercel Setup

1. Go to Vercel > Settings > Environment Variables
2. Add (Production + Preview):
   ```
   MEDUSA_BACKEND_URL=https://your-tunnel.trycloudflare.com
   NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_your_key
   NEXT_PUBLIC_DEFAULT_REGION=ph
   ```
3. Redeploy

## Full Documentation

See `DOCKER-DEV-MODE-GUIDE.md` for complete guide.
