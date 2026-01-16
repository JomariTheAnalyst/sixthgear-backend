# Marketing System Documentation

## Overview

Admin-managed marketing UI system for Sixthgear with:

1. **Announcement Strip** - Top bar with dismissible messages
2. **Banner Ads** - Flexible placement banners for any section
3. **Popup Ads** - Homepage popups with frequency control
4. **Preview Mode** - View draft content before publishing

## Architecture

### Backend (Medusa v2)

**Module:** `src/modules/marketing`

- `models/marketing-item.ts` - Database model
- `service.ts` - Business logic
- `migrations/` - Database migrations

**API Endpoints:**

| Endpoint                             | Method | Description                         |
| ------------------------------------ | ------ | ----------------------------------- |
| `/store/marketing`                   | GET    | Get active marketing for storefront |
| `/store/marketing/validate-preview`  | GET    | Validate preview token              |
| `/admin/marketing`                   | GET    | List all marketing items            |
| `/admin/marketing`                   | POST   | Create marketing item               |
| `/admin/marketing/:id`               | GET    | Get single item                     |
| `/admin/marketing/:id`               | PUT    | Update item                         |
| `/admin/marketing/:id`               | DELETE | Delete item                         |
| `/admin/marketing/:id/preview-token` | POST   | Generate preview URL                |

### Frontend (Next.js)

**Components:** `src/modules/marketing/`

- `AnnouncementStrip` - Dismissible top bar
- `BannerSlot` - Renders banners by placement
- `PopupAds` - Homepage popup with delay/frequency
- `PreviewBanner` - Shows when in preview mode

**Data:** `src/lib/data/marketing.ts`

- `getMarketingForPath(path)` - Fetch marketing for a page

## Usage

### 1. Announcement Strip

Automatically rendered in layout when a strip is published.

```tsx
// Already integrated in layout.tsx via MarketingProvider
<AnnouncementStrip item={marketing.strip} />
```

### 2. Banner Slots

Add banners anywhere using placement keys:

```tsx
import { BannerSlot } from "@modules/marketing"

// In any page/component
<BannerSlot
  banners={marketing.banners}
  placement="home_hero_below"
/>

// Show all banners for a placement
<BannerSlot
  banners={marketing.banners}
  placement="shop_sidebar"
  showAll={true}
/>
```

**Placement Examples:**

- `home_hero_below` - Below hero section
- `home_mid` - Middle of homepage
- `shop_top` - Top of shop page
- `shop_sidebar` - Shop sidebar
- `pdp_below_gallery` - Product page below images

### 3. Popup Ads

Only shown on homepage after delay:

```tsx
// Already integrated in page.tsx
<PopupAds popups={marketing.popups} />
```

**Frequency Options:**

- `once_session` - Show once per browser session
- `once_day` - Show once per day
- `always` - Show every time

## Admin API Examples

### Create Announcement Strip

```bash
POST /admin/marketing
{
  "type": "strip",
  "status": "draft",
  "message": "Free shipping on orders over ₱2,500!",
  "cta_text": "Shop Now",
  "cta_url": "/shop",
  "background_color": "#F16D34",
  "text_color": "#FFFFFF",
  "enabled": true,
  "priority": 100,
  "pages": ["*"]
}
```

### Create Banner

```bash
POST /admin/marketing
{
  "type": "banner",
  "status": "draft",
  "title": "Summer Sale",
  "message": "Up to 50% off",
  "cta_text": "Shop Sale",
  "cta_url": "/shop?tag=sale",
  "image_desktop_url": "https://cdn.example.com/banner.jpg",
  "placement": "home_hero_below",
  "pages": ["/"],
  "priority": 50
}
```

### Create Popup

```bash
POST /admin/marketing
{
  "type": "popup",
  "status": "draft",
  "title": "Welcome!",
  "message": "Get 10% off your first order",
  "cta_text": "Subscribe",
  "cta_url": "/newsletter",
  "delay_ms": 3000,
  "frequency": "once_day",
  "pages": ["/"]
}
```

### Publish Item

```bash
PUT /admin/marketing/:id
{
  "status": "published"
}
```

### Generate Preview URL

```bash
POST /admin/marketing/:id/preview-token
{
  "redirect_path": "/"
}

# Response:
{
  "token": "abc123...",
  "preview_url": "http://localhost:8000/api/preview?token=abc123...&redirect=/",
  "expires_in": 600
}
```

## Preview Mode

1. Create/edit a marketing item (status: "draft")
2. Call `POST /admin/marketing/:id/preview-token`
3. Open the returned `preview_url` in browser
4. See draft content on the real storefront
5. Click "X" on preview banner or visit `/api/exit-preview` to exit

## Database Schema

```sql
CREATE TABLE marketing_item (
  id VARCHAR(255) PRIMARY KEY,
  type VARCHAR(50) NOT NULL,        -- 'strip' | 'banner' | 'popup'
  status VARCHAR(50) DEFAULT 'draft', -- 'draft' | 'published'
  title TEXT,
  message TEXT,
  cta_text TEXT,
  cta_url TEXT,
  image_desktop_url TEXT,
  image_mobile_url TEXT,
  background_color VARCHAR(50),
  text_color VARCHAR(50),
  enabled BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  start_at TIMESTAMPTZ,
  end_at TIMESTAMPTZ,
  pages JSONB DEFAULT '[]',
  device VARCHAR(50) DEFAULT 'all', -- 'all' | 'mobile' | 'desktop'
  placement VARCHAR(100),           -- Banner only
  delay_ms INTEGER DEFAULT 2000,    -- Popup only
  frequency VARCHAR(50),            -- Popup only
  dismiss_key VARCHAR(100),         -- Popup only
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

## Setup

1. Run migrations:

   ```bash
   cd sixthgear-backend
   npx medusa db:migrate
   ```

2. Seed sample data:

   ```bash
   npx medusa exec src/scripts/seed-marketing.ts
   ```

3. Restart backend and frontend

## Environment Variables

**Backend (.env):**

```
STOREFRONT_URL=http://localhost:8000
REDIS_URL=redis://127.0.0.1:6379
```

**Frontend (.env):**

```
NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9000
```
