# Custom Order Number Implementation - SIX-000123 Format

## 🤖 AGENT & SKILLS APPLIED

**Agent**: Backend Specialist + Database Architect  
**Skills**: NodeJS Best Practices, Database Design, API Patterns, Clean Code

---

## Discovery

### Medusa v2 Order Fields

Medusa v2 Order model already has TWO fields for order numbers:

1. **`display_id`** (number) - Auto-incremented numeric ID (1, 2, 3, ...)
2. **`custom_display_id`** (string) - Custom order number field (currently unused)

**Perfect!** We can use `custom_display_id` for our `SIX-000123` format without modifying core Medusa functionality.

---

## Implementation Strategy

### Option 1: Use `custom_display_id` Field ✅ (RECOMMENDED)

**Advantages:**

- Field already exists in Medusa v2
- No migration needed
- No risk of breaking existing functionality
- Clean separation between internal ID and customer-facing ID

**Implementation:**

1. Create a subscriber that listens to `order.placed` event
2. Generate custom order number: `SIX-` + zero-padded `display_id`
3. Update order's `custom_display_id` field
4. Use `custom_display_id` in emails, storefront, and UI

### Option 2: Override `display_id` Generation ❌ (NOT RECOMMENDED)

**Disadvantages:**

- Requires modifying Medusa core behavior
- Risk of breaking admin panel expectations
- More complex implementation
- Harder to maintain

---

## Implementation Plan

### Step 1: Create Order Number Generator Utility

**File:** `sixthgear-backend/src/utils/generate-order-number.ts`

```typescript
/**
 * Generate custom order number in format: SIX-000123
 *
 * @param displayId - The numeric display_id from Medusa
 * @returns Formatted order number (e.g., "SIX-000123")
 */
export function generateOrderNumber(displayId: number): string {
  // Pad with zeros to 6 digits
  const paddedNumber = String(displayId).padStart(6, "0");
  return `SIX-${paddedNumber}`;
}

/**
 * Parse order number back to display_id
 * Useful for order lookup by custom order number
 *
 * @param orderNumber - Custom order number (e.g., "SIX-000123")
 * @returns Numeric display_id or null if invalid format
 */
export function parseOrderNumber(orderNumber: string): number | null {
  const match = orderNumber.match(/^SIX-(\d{6})$/);
  if (!match) return null;
  return parseInt(match[1], 10);
}
```

### Step 2: Create Subscriber to Set Custom Order Number

**File:** `sixthgear-backend/src/subscribers/set-custom-order-number.ts`

```typescript
import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { Modules, ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { generateOrderNumber } from "../utils/generate-order-number";

/**
 * Set Custom Order Number Subscriber
 *
 * Automatically generates and sets custom_display_id when an order is placed.
 * Format: SIX-000123
 *
 * Event: order.placed
 */
export default async function setCustomOrderNumberHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  console.log("🔢 [Custom Order Number] Processing order:", data.id);

  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  // Fetch order to get display_id
  const { data: orders } = await query.graph({
    entity: "order",
    fields: ["id", "display_id", "custom_display_id"],
    filters: { id: data.id },
  });

  const order = orders[0];
  if (!order) {
    console.error("❌ [Custom Order Number] Order not found:", data.id);
    return;
  }

  // Skip if custom_display_id already set
  if (order.custom_display_id) {
    console.log(
      "✅ [Custom Order Number] Already set:",
      order.custom_display_id,
    );
    return;
  }

  // Generate custom order number
  const customOrderNumber = generateOrderNumber(order.display_id);

  console.log("🔢 [Custom Order Number] Generated:", {
    display_id: order.display_id,
    custom_display_id: customOrderNumber,
  });

  // Update order with custom order number
  try {
    const orderModuleService = container.resolve(Modules.ORDER);

    await orderModuleService.updateOrders({
      id: order.id,
      custom_display_id: customOrderNumber,
    });

    console.log(
      "✅ [Custom Order Number] Set successfully:",
      customOrderNumber,
    );
  } catch (error) {
    console.error("❌ [Custom Order Number] Failed to set:", error);
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
};
```

### Step 3: Update Email Templates

Update all email templates to use `custom_display_id` instead of `display_id`:

**Files to update:**

- `src/modules/resend/emails/order-placed.tsx`
- `src/modules/resend/emails/order-shipped.tsx`
- `src/modules/resend/emails/order-delivered.tsx`

**Change:**

```typescript
// Before
Order #{order.display_id}

// After
Order #{order.custom_display_id || order.display_id}
```

### Step 4: Update Workflows

Update workflows to fetch `custom_display_id`:

**Files to update:**

- `src/workflows/send-order-confirmation.ts`
- `src/workflows/send-order-shipped.ts`
- `src/workflows/send-order-delivered.ts`

**Add to fields array:**

```typescript
fields: [
  "id",
  "display_id",
  "custom_display_id", // ← Add this
  "email",
  // ... other fields
];
```

### Step 5: Update Admin Notifications

Update admin notification subscribers to use custom order number:

**File:** `src/subscribers/admin-order-placed.ts`

```typescript
// Fetch order with custom_display_id
const { data: orders } = await query.graph({
  entity: "order",
  fields: [
    "id",
    "display_id",
    "custom_display_id",
    "total",
    "currency_code",
    "email",
  ],
  filters: { id: data.id },
});

const order = orders[0];

// Use custom_display_id if available, fallback to display_id
const orderNumber = order.custom_display_id || `#${order.display_id}`;

// Send notification
await notificationModuleService.createNotifications({
  to: "admin",
  channel: "feed",
  template: "order-placed-admin",
  data: {
    title: `New Order ${orderNumber}`,
    description: `Order total: ${formattedTotal} • Customer: ${order.email}`,
    resource_id: order.id,
    resource_type: "order",
    order_id: order.id,
    order_display_id: order.display_id,
  },
});
```

### Step 6: Update Storefront (Frontend)

Update frontend to display custom order number:

**Files to update:**

- `sixthgear-frontend/src/modules/order/templates/order-confirmed-template.tsx`
- `sixthgear-frontend/src/modules/account/components/order-overview/index.tsx`
- Any other components displaying order numbers

**Change:**

```typescript
// Before
Order #{order.display_id}

// After
Order #{order.custom_display_id || order.display_id}
```

### Step 7: Add Order Lookup by Custom Number (Optional)

Create API route to lookup orders by custom order number:

**File:** `src/api/store/orders/lookup/route.ts`

```typescript
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { parseOrderNumber } from "../../../../utils/generate-order-number";

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse,
): Promise<void> {
  const { order_number } = req.query;

  if (!order_number || typeof order_number !== "string") {
    return res.status(400).json({
      error: "order_number query parameter is required",
    });
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  // Try to parse as custom order number (SIX-000123)
  const displayId = parseOrderNumber(order_number);

  const filters = displayId
    ? { display_id: displayId }
    : { custom_display_id: order_number };

  const { data: orders } = await query.graph({
    entity: "order",
    fields: ["id", "display_id", "custom_display_id", "email", "status"],
    filters,
  });

  if (!orders.length) {
    return res.status(404).json({
      error: "Order not found",
    });
  }

  res.json({ order: orders[0] });
}
```

---

## Testing Plan

### Test 1: Order Number Generation

1. Place a new order
2. Check backend logs for:
   ```
   🔢 [Custom Order Number] Generated: { display_id: 50, custom_display_id: 'SIX-000050' }
   ✅ [Custom Order Number] Set successfully: SIX-000050
   ```
3. Check database:
   ```sql
   SELECT display_id, custom_display_id FROM "order" ORDER BY created_at DESC LIMIT 5;
   ```
4. **Expected:** `custom_display_id = 'SIX-000050'`

### Test 2: Email Display

1. Place order
2. Check order confirmation email
3. **Expected:** Subject shows "Order SIX-000050" (not "Order #50")

### Test 3: Admin Notification

1. Place order
2. Check admin panel notification
3. **Expected:** "New Order SIX-000050"

### Test 4: Storefront Display

1. Complete checkout
2. View order confirmation page
3. **Expected:** "Order SIX-000050"

### Test 5: Backward Compatibility

1. Check existing orders (before implementation)
2. **Expected:** Display `#47`, `#48`, `#49` (fallback to display_id)
3. New orders show `SIX-000051`, `SIX-000052`, etc.

---

## Rollout Strategy

### Phase 1: Backend Implementation

1. Create utility functions
2. Create subscriber
3. Test with new orders
4. Verify database updates

### Phase 2: Email Updates

1. Update email templates
2. Update workflows
3. Test email sending

### Phase 3: Admin Updates

1. Update admin notifications
2. Test admin panel display

### Phase 4: Frontend Updates

1. Update storefront templates
2. Test order confirmation page
3. Test order history

---

## Benefits

✅ **No Breaking Changes** - Uses existing `custom_display_id` field  
✅ **Backward Compatible** - Existing orders still work  
✅ **Professional Format** - `SIX-000123` looks better than `#123`  
✅ **Easy to Implement** - Simple subscriber + utility functions  
✅ **Maintainable** - Clean separation of concerns  
✅ **Testable** - Each component can be tested independently

---

## Next Steps

1. ✅ Read Medusa documentation (DONE)
2. ⏳ Create utility functions
3. ⏳ Create subscriber
4. ⏳ Update email templates
5. ⏳ Update workflows
6. ⏳ Update admin notifications
7. ⏳ Update frontend
8. ⏳ Test end-to-end

---

**Ready to implement?** Let me know and I'll create all the files!
