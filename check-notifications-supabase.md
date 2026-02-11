# Admin Notifications Diagnostic - Supabase Edition

## 🤖 AGENT & SKILLS APPLIED

**Agent**: Debugger + Database Architect  
**Skills**: Systematic Debugging, Database Design

---

## Quick Checks for Supabase Database

### Option 1: Supabase Dashboard (Easiest)

1. **Go to Supabase Dashboard**
   - Open: https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor**
   - Click "SQL Editor" in left sidebar
   - Click "New query"

3. **Run This Query**

   ```sql
   -- Check total notifications
   SELECT COUNT(*) as total_notifications FROM notification;

   -- Check admin panel notifications
   SELECT COUNT(*) as admin_notifications
   FROM notification
   WHERE channel = 'feed';

   -- Show recent admin notifications
   SELECT
       id,
       to_field as recipient,
       channel,
       template,
       data->>'title' as title,
       data->>'description' as description,
       created_at
   FROM notification
   WHERE channel = 'feed'
   ORDER BY created_at DESC
   LIMIT 10;
   ```

4. **Click "Run"** to execute

### Option 2: Using psql Command Line

If you have `psql` installed locally:

```bash
# Connect to Supabase
psql "postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT].supabase.co:5432/postgres"

# Then run queries
SELECT COUNT(*) FROM notification WHERE channel = 'feed';
\q
```

### Option 3: Check Backend Logs

Since you're running backend locally (not in Docker), check the terminal where you started the backend:

```bash
# If running with npm
npm run dev

# Look for these log messages:
# 🔔 [Admin Notification] Order placed event received
# ✅ [Admin Notification] Notification sent successfully
```

---

## Debugging Steps

### Step 1: Verify Subscribers Are Loaded

**Check if subscriber files exist:**

```bash
# Navigate to backend
cd sixthgear-backend

# List subscriber files
dir src\subscribers\admin-*.ts
```

**Expected files:**

- `admin-order-placed.ts`
- `admin-order-canceled.ts`
- `admin-payment-failed.ts`
- `admin-order-fulfillment-created.ts`
- `admin-contact-inquiry-created.ts`

### Step 2: Restart Backend

```bash
# Stop backend (Ctrl+C)
# Then restart
npm run dev
```

**Watch for subscriber loading messages** in the startup logs.

### Step 3: Place Test Order

1. Go to storefront: `http://localhost:8000`
2. Add product to cart
3. Complete checkout (COD or Stripe test)
4. **Watch backend terminal** for notification logs

**Expected logs:**

```
🔔 [Admin Notification] Order placed event received: order_xxx
📦 [Admin Notification] Order details: { id: 'order_xxx', ... }
✅ [Admin Notification] Notification sent successfully
```

### Step 4: Check Supabase Database

Run the SQL query from Option 1 above to see if notification was created.

### Step 5: Check Admin Panel

1. Open admin: `http://localhost:9000/app`
2. **Hard refresh**: Ctrl+F5 (clears cache)
3. Click bell icon (top right)
4. Check for notifications

---

## Common Issues & Solutions

### Issue 1: No Log Messages When Placing Order

**Symptom:** Order is created but no "🔔 Order placed event received" log

**Possible Causes:**

- Subscribers not loaded
- Event not being emitted
- Subscriber file has errors

**Solution:**

```bash
# Check for TypeScript errors
npm run build

# If errors, fix them and restart
npm run dev
```

### Issue 2: Logs Show Success But No Notifications in Database

**Symptom:** See "✅ Notification sent successfully" but Supabase query returns 0

**Possible Causes:**

- Wrong database connection
- Notification module not configured correctly
- Local provider not working

**Solution:**

1. **Verify database connection:**

   ```bash
   # Check .env.local has correct DATABASE_URL
   type .env.local | findstr DATABASE_URL
   ```

2. **Check medusa-config.ts:**
   - Ensure local provider is configured
   - Ensure `channels: ["feed"]` is set

3. **Check notification table exists:**

   ```sql
   -- In Supabase SQL Editor
   SELECT table_name
   FROM information_schema.tables
   WHERE table_name = 'notification';
   ```

   If table doesn't exist:

   ```bash
   # Run migrations
   npm run medusa db:migrate
   ```

### Issue 3: Notifications in Database But Not in Admin Panel

**Symptom:** Supabase shows notifications but admin panel is empty

**Possible Causes:**

- Browser cache
- Admin UI not fetching correctly
- Wrong recipient field

**Solution:**

1. **Clear browser cache:**
   - Press Ctrl+Shift+Delete
   - Clear cached images and files
   - Close and reopen browser

2. **Check notification recipient:**

   ```sql
   -- In Supabase SQL Editor
   SELECT to_field, COUNT(*)
   FROM notification
   WHERE channel = 'feed'
   GROUP BY to_field;
   ```

   Should show `to_field = 'admin'`

3. **Check browser console:**
   - Open admin panel
   - Press F12
   - Go to Console tab
   - Look for errors related to notifications

4. **Check network requests:**
   - Press F12
   - Go to Network tab
   - Refresh page
   - Look for `/admin/notifications` request
   - Check response data

---

## Quick Diagnostic SQL Queries

### Check if notification table exists

```sql
SELECT EXISTS (
   SELECT FROM information_schema.tables
   WHERE table_name = 'notification'
);
```

### Count notifications by channel

```sql
SELECT
    channel,
    COUNT(*) as count
FROM notification
GROUP BY channel;
```

### Show all notification templates

```sql
SELECT DISTINCT template
FROM notification
WHERE channel = 'feed';
```

### Show notification data structure

```sql
SELECT
    id,
    to_field,
    channel,
    template,
    data,
    created_at
FROM notification
WHERE channel = 'feed'
ORDER BY created_at DESC
LIMIT 1;
```

### Check if order.placed events created notifications

```sql
SELECT
    template,
    data->>'title' as title,
    created_at
FROM notification
WHERE template LIKE '%order%'
ORDER BY created_at DESC;
```

---

## What to Share for Further Help

If notifications still don't work, share:

1. **Supabase query results:**

   ```sql
   SELECT COUNT(*) FROM notification WHERE channel = 'feed';
   ```

2. **Backend logs after placing order:**
   - Copy the terminal output after completing checkout
   - Look for notification-related messages

3. **Browser console errors:**
   - F12 → Console tab
   - Any red error messages

4. **Network request:**
   - F12 → Network tab
   - Find `/admin/notifications` request
   - Share the response

5. **Subscriber files exist:**
   ```bash
   dir src\subscribers\admin-*.ts
   ```

---

## Expected Behavior

### When Order is Placed:

1. **Backend logs:**

   ```
   🔔 [Admin Notification] Order placed event received: order_01XXX
   📦 [Admin Notification] Order details: { ... }
   ✅ [Admin Notification] Notification sent successfully
   ```

2. **Supabase database:**
   - New row in `notification` table
   - `channel = 'feed'`
   - `to_field = 'admin'`
   - `template = 'order-placed-admin'`

3. **Admin panel:**
   - Bell icon shows badge (1)
   - Click bell → See "New Order #XXX"
   - Click notification → Navigate to order

---

## Next Steps

1. ✅ Run Supabase SQL query to check notifications
2. ✅ Restart backend and watch logs
3. ✅ Place test order
4. ✅ Check backend logs for notification messages
5. ✅ Check Supabase for new notification record
6. ✅ Check admin panel bell icon

**Start with Step 1** - run the SQL query in Supabase Dashboard to see current state.
