# 🚀 MEILISEARCH QUICK START - SIXTHGEAR

**Time to Complete**: 5 minutes  
**Difficulty**: Easy

---

## 📋 PREREQUISITES

- [x] Docker Desktop running
- [x] Backend `.env` file configured

---

## ⚡ QUICK START (3 STEPS)

### Step 1: Add Environment Variables

Add to `sixthgear-backend/.env`:

```env
# Meilisearch Configuration
MEILISEARCH_HOST=http://localhost:7700
MEILISEARCH_API_KEY=sixthgear_master_key_2026_secure
MEILISEARCH_PRODUCT_INDEX_NAME=sixthgear_products
```

**Important**: Change the API key to something secure (minimum 16 characters).

---

### Step 2: Start Meilisearch

```bash
# From project root (not sixthgear-backend)
docker-compose up -d meilisearch
```

**Note**: This uses the root `docker-compose.yml` for local development.

**Wait 10 seconds**, then verify:

```bash
# Check if running
docker ps | grep meilisearch

# Check health
curl http://localhost:7700/health
```

**Expected**: `{"status":"available"}`

---

### Step 3: Access Meilisearch Dashboard

Open browser: **http://localhost:7700**

You should see the Meilisearch search preview interface.

---

## ✅ VERIFICATION

### Test Meilisearch API

```bash
# Get indexes (should be empty initially)
curl http://localhost:7700/indexes \
  -H "Authorization: Bearer sixthgear_master_key_2026_secure"
```

**Expected**: `{"results":[],"offset":0,"limit":20,"total":0}`

---

## 🔄 RESTART BACKEND

Now restart your Medusa backend to connect to Meilisearch:

```bash
# From project root
docker-compose restart medusa
```

---

## 📚 NEXT STEPS

1. **Follow Full Implementation Guide**: See `MEILISEARCH-IMPLEMENTATION-GUIDE.md`
2. **Install Backend Integration**: Create Meilisearch module
3. **Install Frontend Search**: Add search components

---

## 🛑 STOP MEILISEARCH

```bash
docker-compose stop meilisearch
```

## 🗑️ REMOVE MEILISEARCH (INCLUDING DATA)

```bash
docker-compose down -v meilisearch
```

---

## 🔧 TROUBLESHOOTING

### Container won't start

```bash
# Check logs
docker logs sixthgear-meilisearch

# Common issue: API key too short
# Fix: Use minimum 16 characters
```

### Port 7700 already in use

```bash
# Find process using port
netstat -ano | findstr :7700

# Kill process or change port in docker-compose.yml
```

### Can't access dashboard

- Check firewall settings
- Verify Docker Desktop is running
- Try: http://127.0.0.1:7700

---

**That's it! Meilisearch is now running locally.**

For full implementation, see: `MEILISEARCH-IMPLEMENTATION-GUIDE.md`
