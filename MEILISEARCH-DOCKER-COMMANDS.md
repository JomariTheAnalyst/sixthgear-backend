# 🐳 MEILISEARCH DOCKER COMMANDS REFERENCE

Quick reference for managing Meilisearch in Docker.

---

## 🚀 START/STOP COMMANDS

### Start Meilisearch Only

```bash
docker-compose up -d meilisearch
```

### Start All Services (Redis + Meilisearch + Medusa)

```bash
docker-compose up -d
```

### Stop Meilisearch Only

```bash
docker-compose stop meilisearch
```

### Stop All Services

```bash
docker-compose stop
```

### Restart Meilisearch

```bash
docker-compose restart meilisearch
```

---

## 📊 STATUS & LOGS

### Check Container Status

```bash
docker ps | grep meilisearch
```

### View Logs (Live)

```bash
docker logs -f sixthgear-meilisearch
```

### View Last 100 Lines

```bash
docker logs --tail 100 sixthgear-meilisearch
```

### Check Health

```bash
docker inspect sixthgear-meilisearch --format='{{.State.Health.Status}}'
```

---

## 🔍 INSPECT & DEBUG

### Enter Container Shell

```bash
docker exec -it sixthgear-meilisearch sh
```

### Check Meilisearch Version

```bash
docker exec sixthgear-meilisearch meilisearch --version
```

### View Container Configuration

```bash
docker inspect sixthgear-meilisearch
```

### Check Resource Usage

```bash
docker stats sixthgear-meilisearch
```

---

## 🗄️ DATA MANAGEMENT

### Backup Meilisearch Data

```bash
# Create backup directory
mkdir -p ./backups/meilisearch

# Copy data from volume
docker cp sixthgear-meilisearch:/meili_data ./backups/meilisearch/
```

### Restore Meilisearch Data

```bash
# Stop container
docker-compose stop meilisearch

# Copy backup to volume
docker cp ./backups/meilisearch/meili_data sixthgear-meilisearch:/

# Start container
docker-compose start meilisearch
```

### View Volume Location

```bash
docker volume inspect sixthgear-backend_meilisearch_data
```

---

## 🗑️ CLEANUP COMMANDS

### Remove Container (Keep Data)

```bash
docker-compose rm -f meilisearch
```

### Remove Container + Data Volume

```bash
docker-compose down -v meilisearch
```

### Remove All Unused Volumes

```bash
docker volume prune
```

### Complete Cleanup (All Services)

```bash
docker-compose down -v
```

---

## 🔄 REBUILD & UPDATE

### Rebuild Meilisearch (After Config Changes)

```bash
docker-compose up -d --force-recreate meilisearch
```

### Pull Latest Meilisearch Image

```bash
docker-compose pull meilisearch
docker-compose up -d meilisearch
```

### Update to Specific Version

Edit `docker-compose.yml`:

```yaml
meilisearch:
  image: getmeili/meilisearch:v1.7 # Change version
```

Then:

```bash
docker-compose up -d meilisearch
```

---

## 🌐 NETWORK COMMANDS

### List Networks

```bash
docker network ls | grep medusa
```

### Inspect Network

```bash
docker network inspect sixthgear-backend_medusa-network
```

### Test Connectivity (From Medusa Container)

```bash
docker exec sixthgear-medusa curl http://meilisearch:7700/health
```

---

## 📈 MONITORING

### Real-time Resource Usage

```bash
docker stats sixthgear-meilisearch
```

### Check Disk Usage

```bash
docker system df -v | grep meilisearch
```

### View All Meilisearch Processes

```bash
docker top sixthgear-meilisearch
```

---

## 🔐 SECURITY

### Change Master Key

1. Update `.env`:

```env
MEILISEARCH_API_KEY=new_secure_key_here
```

2. Recreate container:

```bash
docker-compose up -d --force-recreate meilisearch
```

### View Environment Variables

```bash
docker exec sixthgear-meilisearch env | grep MEILI
```

---

## 🧪 TESTING

### Test Meilisearch API

```bash
# Health check
curl http://localhost:7700/health

# Get version
curl http://localhost:7700/version

# List indexes
curl http://localhost:7700/indexes \
  -H "Authorization: Bearer your_master_key"

# Get stats
curl http://localhost:7700/stats \
  -H "Authorization: Bearer your_master_key"
```

### Test Search

```bash
curl 'http://localhost:7700/indexes/sixthgear_products/search?q=helmet' \
  -H "Authorization: Bearer your_search_key"
```

---

## 🚨 EMERGENCY COMMANDS

### Force Stop (If Hanging)

```bash
docker kill sixthgear-meilisearch
```

### Remove and Recreate (Fresh Start)

```bash
docker-compose stop meilisearch
docker-compose rm -f meilisearch
docker volume rm sixthgear-backend_meilisearch_data
docker-compose up -d meilisearch
```

### Check for Port Conflicts

```bash
# Windows
netstat -ano | findstr :7700

# Linux/Mac
lsof -i :7700
```

---

## 📝 USEFUL ALIASES (Optional)

Add to your shell profile (`.bashrc`, `.zshrc`, etc.):

```bash
# Meilisearch shortcuts
alias ms-start='docker-compose up -d meilisearch'
alias ms-stop='docker-compose stop meilisearch'
alias ms-restart='docker-compose restart meilisearch'
alias ms-logs='docker logs -f sixthgear-meilisearch'
alias ms-health='curl http://localhost:7700/health'
alias ms-stats='curl http://localhost:7700/stats -H "Authorization: Bearer $MEILISEARCH_API_KEY"'
```

---

## 🔗 QUICK LINKS

- **Dashboard**: http://localhost:7700
- **Health Check**: http://localhost:7700/health
- **API Docs**: https://www.meilisearch.com/docs/reference/api/overview

---

**For full implementation guide, see**: `MEILISEARCH-IMPLEMENTATION-GUIDE.md`
