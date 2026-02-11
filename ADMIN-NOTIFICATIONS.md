# Admin Notification Panel - Implementation Guide

## 📋 Overview

The admin notification panel displays real-time notifications for important events in the Medusa Admin dashboard. This system runs alongside customer email notifications without interfering with them.

## 🏗️ Architecture

### Notification Providers

| Provider   | Channel | Purpose             | Recipient   |
| ---------- | ------- | ------------------- | ----------- |
| **Resend** | `email` | Customer emails     | Customers   |
| **Local**  | `feed`  | Admin notifications | Admin users |

### How It Works

1. **Event occurs** (e.g., order placed)
2. **Multiple subscribers listen** to the same event
3. **Customer email subscriber** → Sends email via Resend
4. **Admin notification subscriber** → Sends notification to admin panel via Local provider
5. **Both run independently** without conflicts

## 📁 File Structure

```
sixthgear-backend/
├── src/
│   └── subscribers/
│       ├── order-placed.ts                          # Customer email
│       ├── admin-order-placed.ts                    # Admin notification ✨
│       ├── order-fulfillment-created.ts             # Customer email
│       ├── admin-order-fulfillment-created.ts       # Admin notification ✨
│       ├── admin-order-canceled.ts                  # Admin notification ✨
│       ├── admin-payment-failed.ts                  # Admin notification ✨
│       └── admin-contact-inquiry-created.ts         # Admin notification ✨
└── medusa-config.ts                                 # Provider configuration
```

## 🔔 Implemented Notifications

### 1. New Order Notification

- **Event**: `order.placed`
- **Priority**: 🔴 High
- **Shows**: Order ID, total amount, customer email
- **Links to**: Order details page

### 2. Order Canceled Notification

- **Event**: `order.canceled`
- **Priority**: 🟡 Medium
- **Shows**: Order ID, amount, customer email
- **Links to**: Order details page

### 3. Payment Failed Notification

- **Event**: `payment.payment_failed`
- **Priority**: 🔴 High
- **Shows**: Payment amount, order ID, customer email
- **Links to**: Order/payment details page

### 4. Order Shipped Notification

- **Event**: `order.fulfillment_created`
- **Priority**: 🟢 Low (Informational)
- **Shows**: Order ID, tracking number, carrier
- **Links to**: Order details page

### 5. Contact Inquiry Notification

- **Event**: `contact_inquiry.created`
- **Priority**: 🟡 Medium
- **Shows**: Customer name, subject, message preview
- **Links to**: Inquiry details page

## 🚀 Usage

### Viewing Notifications

1. Open Medusa Admin (`http://localhost:9000/app` or `https://admin.sixthgearmoto.com`)
2. Look for the **bell icon** 🔔 in the top navigation
3. Click to view all notifications
4. Unread notifications show a **badge count**

### Notification Actions

- **Click notification** → Navigate to related resource
- **Mark as read** → Dismiss notification
- **Delete** → Remove notification permanently

## 🧪 Testing

### Test New Order Notification

1. Place an order through the storefront
2. Check admin panel → Bell icon should show (1)
3. Click bell → See "New Order #XXX" notification
4. Click notification → Navigate to order details

### Test Contact Inquiry Notification

1. Submit contact form on storefront
2. Check admin panel → Bell icon should show (1)
3. Click bell → See "New Contact Inquiry from [Name]" notification

### Test Payment Failed Notification

1. Use a test card that fails (Stripe test mode)
2. Check admin panel → See "Payment Failed" notification

## 📊 Notification Data Structure

Each notification includes:

```typescript
{
  to: "admin",                    // Recipient (always "admin" for panel)
  channel: "feed",                // Channel (always "feed" for panel)
  template: "order-placed-admin", // Template identifier
  data: {
    title: "New Order #1234",     // Notification title
    description: "Order total...", // Notification description
    resource_id: "order_123",     // Related resource ID
    resource_type: "order",       // Resource type for linking
  }
}
```

## 🔧 Configuration

### medusa-config.ts

```typescript
{
  resolve: "@medusajs/medusa/notification",
  options: {
    providers: [
      // Customer emails
      {
        resolve: "./src/modules/resend",
        id: "resend",
        options: {
          channels: ["email"],
          // ... Resend config
        },
      },
      // Admin notifications
      {
        resolve: "@medusajs/medusa/notification-local",
        id: "local",
        options: {
          channels: ["feed"],
        },
      },
    ],
  },
}
```

## 🎨 Customization

### Adding New Notification Types

1. **Create subscriber** in `src/subscribers/admin-[event-name].ts`
2. **Listen to event** using `export const config`
3. **Send notification** using Notification Module
4. **Restart backend** to load new subscriber

Example:

```typescript
import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { Modules } from "@medusajs/framework/utils";

export default async function adminMyEventHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const notificationModuleService = container.resolve(Modules.NOTIFICATION);

  await notificationModuleService.createNotifications({
    to: "admin",
    channel: "feed",
    template: "my-event-admin",
    data: {
      title: "My Event Occurred",
      description: "Event details...",
      resource_id: data.id,
      resource_type: "my_resource",
    },
  });
}

export const config: SubscriberConfig = {
  event: "my.event",
};
```

## 📚 References

- [Medusa Notification Module](https://docs.medusajs.com/resources/infrastructure-modules/notification)
- [Local Notification Provider](https://docs.medusajs.com/resources/infrastructure-modules/notification/local)
- [Creating Subscribers](https://docs.medusajs.com/development/events/create-subscriber)
- [Send Notifications](https://docs.medusajs.com/resources/infrastructure-modules/notification/send-notification)

## ✅ Benefits

- ✅ **Real-time alerts** for important events
- ✅ **No email overload** for admins
- ✅ **Centralized notifications** in one place
- ✅ **Persistent history** of all events
- ✅ **Quick navigation** to related resources
- ✅ **Independent from customer emails** (no conflicts)

## 🔄 Maintenance

### Restart Backend

After adding new subscribers or modifying existing ones:

```bash
# Development
npm run dev

# Production (Docker)
docker compose restart medusa
```

### Check Logs

If notifications aren't appearing:

```bash
# Check for errors in backend logs
docker compose logs medusa -f
```

### Verify Configuration

Ensure local provider is registered in `medusa-config.ts` with `channels: ["feed"]`.

---

**Implementation Date**: February 10, 2026  
**Status**: ✅ Active  
**Maintainer**: SixthGear Development Team
