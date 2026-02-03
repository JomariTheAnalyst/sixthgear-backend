import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

// Rate limiting store (in-memory for simplicity, use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 5; // 5 requests per minute per IP

/**
 * Rate limiting middleware
 */
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(ip);

  if (!record || now > record.resetAt) {
    // Create new record or reset expired one
    rateLimitStore.set(ip, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW,
    });
    return true;
  }

  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }

  record.count++;
  return true;
}

/**
 * Normalize email for comparison
 */
function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Map Medusa order status to user-facing status
 */
function mapOrderStatus(order: any): "processing" | "shipped" | "delivered" {
  const fulfillmentStatus = order.fulfillment_status;
  const deliveryStatus = order.delivery_status || order.fulfillment_status;

  // Check delivery status first
  if (deliveryStatus === "delivered" || deliveryStatus === "completed") {
    return "delivered";
  }

  // Check fulfillment status
  if (
    fulfillmentStatus === "fulfilled" ||
    fulfillmentStatus === "shipped" ||
    fulfillmentStatus === "partially_fulfilled"
  ) {
    return "shipped";
  }

  // Default to processing
  return "processing";
}

/**
 * Build tracking URL from carrier and tracking number
 */
function buildTrackingUrl(
  carrier: string,
  trackingNumber: string,
): string | null {
  if (!carrier || !trackingNumber) return null;

  const carrierLower = carrier.toLowerCase();

  // Common carriers
  const carrierUrls: Record<string, string> = {
    dhl: `https://www.dhl.com/en/express/tracking.html?AWB=${trackingNumber}`,
    fedex: `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`,
    ups: `https://www.ups.com/track?tracknum=${trackingNumber}`,
    usps: `https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingNumber}`,
    "j&t": `https://www.jtexpress.ph/trajectoryQuery?trackingNo=${trackingNumber}`,
    jnt: `https://www.jtexpress.ph/trajectoryQuery?trackingNo=${trackingNumber}`,
    lbc: `https://www.lbcexpress.com/track/?tracking_no=${trackingNumber}`,
    "2go": `https://www.2go.com.ph/track-and-trace?tracking_number=${trackingNumber}`,
    ninjavan: `https://www.ninjavan.co/en-ph/tracking?id=${trackingNumber}`,
    "ninja van": `https://www.ninjavan.co/en-ph/tracking?id=${trackingNumber}`,
  };

  // Try to find matching carrier
  for (const [key, url] of Object.entries(carrierUrls)) {
    if (carrierLower.includes(key)) {
      return url;
    }
  }

  // Fallback to universal tracking
  return `https://www.google.com/search?q=track+${encodeURIComponent(
    trackingNumber,
  )}`;
}

/**
 * Extract tracking information from order
 */
function extractTrackingInfo(order: any): Array<{
  trackingNumber: string;
  carrier: string | null;
  trackingUrl: string | null;
}> {
  const trackingInfo: Array<{
    trackingNumber: string;
    carrier: string | null;
    trackingUrl: string | null;
  }> = [];

  const fulfillments = order.fulfillments || [];

  for (const fulfillment of fulfillments) {
    // Check for labels array (from fulfillment_label table)
    if (fulfillment.labels && Array.isArray(fulfillment.labels)) {
      for (const label of fulfillment.labels) {
        if (label.tracking_number) {
          trackingInfo.push({
            trackingNumber: label.tracking_number,
            carrier: label.carrier || null,
            trackingUrl:
              label.tracking_url ||
              buildTrackingUrl(label.carrier, label.tracking_number),
          });
        }
      }
    }
    // Fallback: check for tracking_numbers array (legacy format)
    else if (
      fulfillment.tracking_numbers &&
      Array.isArray(fulfillment.tracking_numbers)
    ) {
      for (const trackingNumber of fulfillment.tracking_numbers) {
        trackingInfo.push({
          trackingNumber,
          carrier: null,
          trackingUrl: buildTrackingUrl("", trackingNumber),
        });
      }
    }
  }

  return trackingInfo;
}

/**
 * Get estimated delivery date
 */
function getEstimatedDelivery(order: any): string | null {
  // Check order metadata
  if (order.metadata?.estimated_delivery) {
    return order.metadata.estimated_delivery;
  }

  // Check fulfillment metadata
  const fulfillments = order.fulfillments || [];
  for (const fulfillment of fulfillments) {
    if (fulfillment.metadata?.estimated_delivery) {
      return fulfillment.metadata.estimated_delivery;
    }
  }

  return null;
}

/**
 * Normalize phone number for comparison
 */
function normalizePhone(phone: string): string {
  // Remove all non-digit characters
  return phone.replace(/\D/g, "");
}

/**
 * Public order tracking endpoint
 * POST /store/track-order
 */
export async function POST(
  req: MedusaRequest,
  res: MedusaResponse,
): Promise<void> {
  try {
    // Get client IP for rate limiting
    const clientIp =
      req.headers["x-forwarded-for"]?.toString().split(",")[0] ||
      req.headers["x-real-ip"]?.toString() ||
      req.socket.remoteAddress ||
      "unknown";

    // Check rate limit
    if (!checkRateLimit(clientIp)) {
      console.log(`[Track Order] Rate limit exceeded for IP: ${clientIp}`);
      res.status(429).json({
        success: false,
        message: "Too many requests. Please try again in a few minutes.",
      });
      return;
    }

    // Validate input - support two tracking methods
    const body = req.body as {
      orderNumber?: string;
      email?: string;
      phone?: string;
      trackingNumber?: string;
    };
    const { orderNumber, email, phone, trackingNumber } = body;

    console.log("[Track Order] Request body:", {
      orderNumber,
      email: email ? "***" : undefined,
      phone: phone ? "***" : undefined,
      trackingNumber,
    });

    // Method 1: Order Number + (Email OR Phone)
    const hasOrderMethod = orderNumber && (email || phone);
    // Method 2: Tracking Number only
    const hasTrackingMethod = trackingNumber;

    console.log("[Track Order] Methods:", {
      hasOrderMethod,
      hasTrackingMethod,
    });

    if (!hasOrderMethod && !hasTrackingMethod) {
      res.status(400).json({
        success: false,
        message:
          "Please provide either (Order Number + Email/Phone) or (Tracking Number).",
      });
      return;
    }

    // Get query service
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

    let order: any = null;
    let trackingIdentifier = ""; // For logging purposes

    // Method 1: Track by Order Number + Email/Phone
    if (hasOrderMethod) {
      const normalizedOrderNumber = orderNumber.trim();
      trackingIdentifier = normalizedOrderNumber;

      console.log(
        `[Track Order] Searching for order: ${normalizedOrderNumber}`,
      );

      // Query order by display_id
      const { data: orders } = await query.graph({
        entity: "order",
        fields: [
          "id",
          "display_id",
          "email",
          "shipping_address.*",
          "status",
          "fulfillment_status",
          "payment_status",
          "created_at",
          "metadata",
          "fulfillments.*",
          "fulfillments.labels.*",
          "items.*",
          "items.product.*",
          "items.product.thumbnail",
          "items.variant.*",
          "items.variant.title",
          "items.title",
          "items.quantity",
          "items.unit_price",
          "items.subtotal",
          "items.thumbnail",
          "summary.*",
          "subtotal",
          "shipping_total",
          "tax_total",
          "discount_total",
          "gift_card_total",
          "total",
          "currency_code",
        ],
        filters: {
          display_id: normalizedOrderNumber,
        },
      });

      console.log(`[Track Order] Found ${orders?.length || 0} orders`);

      if (orders && orders.length > 0) {
        const foundOrder = orders[0];
        const orderEmail = foundOrder.email || "";
        console.log(`[Track Order] Order email: ${orderEmail}`);

        // Verify by email if provided
        if (email) {
          const normalizedEmail = normalizeEmail(email);
          const foundEmail = normalizeEmail(orderEmail);
          console.log(
            `[Track Order] Email match: ${normalizedEmail === foundEmail}`,
          );
          if (foundEmail === normalizedEmail) {
            order = foundOrder;
          }
        }
        // Verify by phone if provided
        else if (phone) {
          const normalizedPhone = normalizePhone(phone);
          const orderPhone = foundOrder.shipping_address?.phone || "";
          const foundPhone = normalizePhone(orderPhone);
          console.log(
            `[Track Order] Phone match: ${normalizedPhone === foundPhone}`,
          );
          if (foundPhone === normalizedPhone) {
            order = foundOrder;
          }
        }
      }

      if (!order) {
        console.log(
          `[Track Order] Order not found or verification failed: ${normalizedOrderNumber}`,
        );
        res.status(404).json({
          success: false,
          message:
            "Order not found. Please check your order number and verification details.",
        });
        return;
      }
    }
    // Method 2: Track by Tracking Number only
    else if (hasTrackingMethod) {
      const normalizedTrackingNumber = trackingNumber.trim();
      trackingIdentifier = normalizedTrackingNumber;

      // Query all orders with fulfillments
      const { data: allOrders } = await query.graph({
        entity: "order",
        fields: [
          "id",
          "display_id",
          "email",
          "shipping_address.*",
          "status",
          "fulfillment_status",
          "payment_status",
          "created_at",
          "metadata",
          "fulfillments.*",
          "fulfillments.labels.*",
          "items.*",
          "items.product.*",
          "items.product.thumbnail",
          "items.variant.*",
          "items.variant.title",
          "items.title",
          "items.quantity",
          "items.unit_price",
          "items.subtotal",
          "items.thumbnail",
          "summary.*",
          "subtotal",
          "shipping_total",
          "tax_total",
          "discount_total",
          "gift_card_total",
          "total",
          "currency_code",
        ],
        filters: {},
      });

      // Search for order with matching tracking number
      if (allOrders && allOrders.length > 0) {
        for (const foundOrder of allOrders) {
          let hasMatchingTracking = false;

          if (foundOrder.fulfillments) {
            for (const fulfillment of foundOrder.fulfillments) {
              if (!fulfillment) continue;

              // Check labels array
              if (fulfillment.labels && Array.isArray(fulfillment.labels)) {
                for (const label of fulfillment.labels) {
                  if (
                    label.tracking_number &&
                    label.tracking_number.trim().toLowerCase() ===
                      normalizedTrackingNumber.toLowerCase()
                  ) {
                    hasMatchingTracking = true;
                    break;
                  }
                }
              }
              if (hasMatchingTracking) break;
            }
          }

          if (hasMatchingTracking) {
            order = foundOrder;
            break;
          }
        }
      }

      if (!order) {
        console.log(
          `[Track Order] Order not found with tracking number: ${normalizedTrackingNumber}`,
        );
        res.status(404).json({
          success: false,
          message: "Order not found. Please check your tracking number.",
        });
        return;
      }
    }

    if (!order) {
      console.log(
        `[Track Order] Order not found or verification failed: ${trackingIdentifier}`,
      );
      res.status(404).json({
        success: false,
        message: "Order not found. Please check your information.",
      });
      return;
    }

    // Map order status
    const userFacingStatus = mapOrderStatus(order);

    // Extract tracking info
    const trackingInfo = extractTrackingInfo(order);

    // Get estimated delivery
    const estimatedDelivery = getEstimatedDelivery(order);

    // Log order data for debugging
    console.log("[Track Order] Order data:", {
      display_id: order.display_id,
      total: order.total,
      subtotal: order.subtotal,
      summary: order.summary,
      shipping_total: order.shipping_total,
      tax_total: order.tax_total,
      items_count: order.items?.length || 0,
      currency_code: order.currency_code,
    });

    // Use summary if available (Medusa v2 uses summary for calculated totals)
    const orderSummary = order.summary || {};
    const subtotal = orderSummary.subtotal || order.subtotal || 0;
    const shipping_total =
      orderSummary.shipping_total || order.shipping_total || 0;
    const tax_total = orderSummary.tax_total || order.tax_total || 0;
    const discount_total =
      orderSummary.discount_total || order.discount_total || 0;
    const gift_card_total =
      orderSummary.gift_card_total || order.gift_card_total || 0;
    const total = orderSummary.total || order.total || 0;

    // Extract order items (sanitized)
    const items = (order.items || []).map((item: any) => {
      console.log("[Track Order] Item data:", {
        title: item.title,
        product_title: item.product?.title,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: item.subtotal,
        raw_subtotal: item.raw_subtotal,
      });

      return {
        title: item.product?.title || item.title || "Product",
        quantity: item.quantity || 1,
        thumbnail: item.product?.thumbnail || item.thumbnail || null,
        variant_title: item.variant?.title || item.variant_title || null,
        unit_price: item.unit_price || item.raw_unit_price || 0,
        subtotal: item.subtotal || item.raw_subtotal || 0,
      };
    });

    // Build sanitized response
    const response = {
      success: true,
      order: {
        orderNumber: order.display_id,
        status: userFacingStatus,
        orderDate: order.created_at,
        trackingInfo: trackingInfo.length > 0 ? trackingInfo : null,
        estimatedDelivery,
        items,
        subtotal,
        shipping_total,
        tax_total,
        discount_total,
        gift_card_total,
        total,
        currency_code: order.currency_code || "PHP",
      },
    };

    console.log("[Track Order] Response:", JSON.stringify(response, null, 2));

    console.log(`[Track Order] Success for: ${trackingIdentifier}`);

    res.status(200).json(response);
  } catch (error) {
    console.error("[Track Order] Error:", error);

    // Generic error response
    res.status(500).json({
      success: false,
      message:
        "An error occurred while tracking your order. Please try again later.",
    });
  }
}
