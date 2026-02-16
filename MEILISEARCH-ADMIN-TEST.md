# 🔍 MEILISEARCH ADMIN PAGE - TESTING GUIDE

**Status**: Fixed - White screen issue resolved  
**Date**: February 12, 2026

---

## ✅ WHAT WAS FIXED

### Issue

The Meilisearch admin page showed a white screen with error: "An unexpected error occurred while rendering this page"

### Root Cause

The page was using `@tanstack/react-query` and the Medusa JS SDK which had initialization issues in the admin context.

### Solution

Replaced the SDK-based implementation with a simpler direct `fetch` API call using native browser fetch with proper credentials.

---

## 🧪 HOW TO TEST

### Step 1: Access Medusa Admin

1. Open browser: `http://localhost:9000/app`
2. Login with your admin credentials

### Step 2: Navigate to Meilisearch Page

1. Click on **Settings** in the left sidebar
2. Scroll down and click on **Meilisearch**
3. You should see the Meilisearch Sync page (no white screen!)

### Step 3: Test Manual Sync

1. Click the **"Sync Data to Meilisearch"** button
2. Wait for the operation to complete
3. You should see a success toast: "Successfully triggered data sync to Meilisearch"

### Step 4: Verify in Meilisearch Dashboard

1. Open: `http://localhost:7700`
2. Click on **Indexes** in the left sidebar
3. You should see `sixthgear_products` index
4. Click on the index to view indexed products

---

## 📝 WHAT THE PAGE DOES

### UI Components

- **Header**: "Meilisearch Sync" title
- **Description**: Explains manual and automatic sync
- **Sync Button**: Triggers manual reindex of all products

### Functionality

When you click "Sync Data to Meilisearch":

1. Sends POST request to `/admin/meilisearch/sync`
2. Backend emits `meilisearch.sync` event
3. Subscriber picks up event and triggers workflow
4. Workflow fetches all products and indexes them
5. Success/error toast appears

---

## 🔍 EXPECTED RESULTS

### Success Case

- ✅ Toast message: "Successfully triggered data sync to Meilisearch"
- ✅ Backend logs show: "Syncing products to Meilisearch"
- ✅ Meilisearch dashboard shows products in `sixthgear_products` index

### Error Case

If sync fails:

- ❌ Toast message: "Failed to sync data to Meilisearch"
- ❌ Check backend logs: `docker logs sixthgear-medusa --tail 50`
- ❌ Check Meilisearch logs: `docker logs sixthgear-meilisearch --tail 50`

---

## 🐛 TROUBLESHOOTING

### Issue: Page still shows white screen

**Solution:**

```bash
# Clear browser cache
# Hard refresh: Ctrl + Shift + R (Windows) or Cmd + Shift + R (Mac)

# Restart backend
docker-compose restart medusa

# Check logs
docker logs sixthgear-medusa --tail 50
```

### Issue: Sync button doesn't work

**Solution:**

```bash
# Check if API route exists
docker exec sixthgear-medusa ls -la /app/src/api/admin/meilisearch/sync/

# Check backend logs for errors
docker logs sixthgear-medusa --tail 100 | grep -i error

# Verify Meilisearch is running
docker ps | grep meilisearch
curl http://localhost:7700/health
```

### Issue: No products in Meilisearch

**Solution:**

```bash
# Check if products exist in database
# Login to Medusa Admin → Products
# Ensure products are published (status = "published")

# Check subscriber logs
docker logs sixthgear-medusa | grep -i meilisearch

# Manually trigger sync again
# Admin → Settings → Meilisearch → Sync Data
```

---

## 📊 VERIFICATION CHECKLIST

After testing, verify:

- [ ] Admin page loads without white screen
- [ ] Sync button is visible and clickable
- [ ] Clicking sync shows loading state
- [ ] Success toast appears after sync
- [ ] Backend logs show sync activity
- [ ] Meilisearch dashboard shows products
- [ ] Product count matches database

---

## 🔄 AUTO-SYNC TESTING

The system also auto-syncs on product changes. Test this:

### Test Create

1. Go to Products → Create Product
2. Fill in details and publish
3. Check Meilisearch dashboard - new product should appear

### Test Update

1. Edit existing product (change title)
2. Save changes
3. Check Meilisearch - changes should reflect

### Test Delete

1. Delete a product
2. Check Meilisearch - product should be removed

---

## 📁 MODIFIED FILES

```
sixthgear-backend/src/admin/routes/settings/meilisearch/page.tsx
```

**Changes:**

- Removed `@tanstack/react-query` dependency
- Removed SDK import
- Replaced with native `fetch` API
- Added `useState` for loading state
- Added descriptive text
- Improved error handling

---

## 🎯 NEXT STEPS

Once admin page is verified working:

1. ✅ Test manual sync
2. ✅ Verify products in Meilisearch
3. ✅ Test auto-sync (create/update/delete)
4. ⏭️ Move to Phase 3: Frontend search implementation

---

## 📞 SUPPORT

If issues persist:

1. Check backend logs: `docker logs sixthgear-medusa`
2. Check Meilisearch logs: `docker logs sixthgear-meilisearch`
3. Verify environment variables in `.env`
4. Ensure Meilisearch is running: `docker ps`
5. Test Meilisearch health: `curl http://localhost:7700/health`

---

**Status**: Ready for testing! 🚀
