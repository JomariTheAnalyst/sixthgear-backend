// @ts-nocheck
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import {
  completeCartWorkflow,
  createOrderWorkflow,
} from "@medusajs/medusa/core-flows";
import { Modules } from "@medusajs/framework/utils";

/**
 * Custom Cart Completion Endpoint
 *
 * Completes a cart with only selected items (for COD and other payment methods)
 * Similar to Stripe flow but for standard Medusa cart completion
 */

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse,
): Promise<void> {
  try {
    const { cart_id, selected_item_ids } = req.body as {
      cart_id: string;
      selected_item_ids?: string[];
    };

    if (!cart_id) {
      res.status(400).json({
        error: "cart_id is required",
      });
      return;
    }

    console.log("[Complete Cart] Completing cart with:", {
      cart_id,
      selected_item_ids: selected_item_ids?.length || "all items",
    });

    const query = req.scope.resolve("query");

    // Get cart with all data
    const { data: carts } = await query.graph({
      entity: "cart",
      fields: [
        "id",
        "email",
        "region_id",
        "customer_id",
        "sales_channel_id",
        "currency_code",
        "items.*",
        "items.id",
        "items.variant_id",
        "items.product_id",
        "items.quantity",
        "items.unit_price",
        "items.title",
        "items.subtitle",
        "items.thumbnail",
        "items.metadata",
        "shipping_address.*",
        "billing_address.*",
        "shipping_methods.*",
        "payment_collection.*",
      ],
      filters: { id: cart_id },
    });

    const cart = carts?.[0];

    if (!cart) {
      res.status(404).json({
        error: "Cart not found",
      });
      return;
    }

    // Filter items if selected_item_ids provided
    if (selected_item_ids && selected_item_ids.length > 0) {
      const itemsToKeep = cart.items.filter((item: any) =>
        selected_item_ids.includes(item.id),
      );

      console.log("[Complete Cart] Creating order with selected items only:", {
        total_items: cart.items.length,
        selected_items: itemsToKeep.length,
      });

      if (itemsToKeep.length === 0) {
        res.status(400).json({
          error: "No selected items found in cart",
        });
        return;
      }

      // Use createOrderWorkflow to create order with only selected items
      // Similar to Stripe webhook approach
      const orderData = {
        region_id: cart.region_id,
        customer_id: cart.customer_id,
        sales_channel_id: cart.sales_channel_id,
        email: cart.email,
        currency_code: cart.currency_code,
        shipping_address: cart.shipping_address
          ? {
              ...cart.shipping_address,
              id: undefined,
            }
          : undefined,
        billing_address: cart.billing_address
          ? {
              ...cart.billing_address,
              id: undefined,
            }
          : undefined,
        items: itemsToKeep.map((item: any) => ({
          variant_id: item.variant_id,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          title: item.title,
          subtitle: item.subtitle,
          thumbnail: item.thumbnail,
          metadata: item.metadata,
        })),
        shipping_methods: cart.shipping_methods?.map((method: any) => ({
          name: method.name,
          amount: method.amount,
          is_tax_inclusive: method.is_tax_inclusive,
          shipping_option_id: method.shipping_option_id,
          data: method.data,
        })),
        metadata: {
          cart_id: cart_id,
          payment_provider: "pp_system_default",
        },
      };

      console.log("[Complete Cart] Creating order with workflow...");

      const { result: order } = await createOrderWorkflow(req.scope).run({
        input: orderData,
      });

      console.log("[Complete Cart] ✅ Order created:", order.id);

      // Authorize payment for COD
      try {
        console.log("[Complete Cart] Authorizing COD payment...");

        const paymentModuleService = req.scope.resolve(Modules.PAYMENT);

        // Get payment collection
        const paymentCollection =
          await paymentModuleService.retrievePaymentCollection(
            cart.payment_collection.id,
            {
              relations: ["payment_sessions"],
            },
          );

        if (paymentCollection.payment_sessions?.length > 0) {
          const paymentSession = paymentCollection.payment_sessions[0];

          // Authorize the payment session
          await paymentModuleService.authorizePaymentSession(
            paymentSession.id,
            {},
          );

          console.log("[Complete Cart] ✅ Payment authorized");

          // Update payment collection amount to match order total
          const orderTotal = order.total || 0;

          await paymentModuleService.updatePaymentCollections(
            cart.payment_collection.id,
            {
              status: "authorized",
              amount: orderTotal,
              authorized_amount: orderTotal,
            },
          );

          console.log("[Complete Cart] ✅ Payment collection updated:", {
            amount: orderTotal,
            status: "authorized",
          });
        }
      } catch (paymentError: any) {
        console.error(
          "[Complete Cart] ⚠️ Payment authorization error:",
          paymentError.message,
        );
      }

      // Link payment collection to order
      try {
        const remoteLink = req.scope.resolve("remoteLink");

        await remoteLink.create({
          [Modules.ORDER]: {
            order_id: order.id,
          },
          [Modules.PAYMENT]: {
            payment_collection_id: cart.payment_collection.id,
          },
        });

        console.log("[Complete Cart] ✅ Payment collection linked to order");
      } catch (linkError: any) {
        console.error(
          "[Complete Cart] ⚠️ Failed to link payment:",
          linkError.message,
        );
      }

      // Create inventory reservations
      try {
        console.log("[Complete Cart] Creating inventory reservations...");

        const inventoryModuleService = req.scope.resolve(Modules.INVENTORY);

        const { data: orders } = await query.graph({
          entity: "order",
          fields: [
            "id",
            "items.*",
            "items.variant_id",
            "items.quantity",
            "items.variant.*",
            "items.variant.manage_inventory",
            "items.variant.inventory_items.*",
            "items.variant.inventory_items.inventory_item_id",
          ],
          filters: { id: order.id },
        });

        const orderWithItems = orders?.[0];

        if (orderWithItems?.items) {
          for (const item of orderWithItems.items) {
            if (
              item.variant?.manage_inventory &&
              item.variant?.inventory_items?.length > 0
            ) {
              const inventoryItem = item.variant.inventory_items[0];

              const locations =
                await inventoryModuleService.listInventoryLevels({
                  inventory_item_id: inventoryItem.inventory_item_id,
                });

              if (locations.length > 0) {
                const location = locations[0];

                await inventoryModuleService.createReservationItems([
                  {
                    inventory_item_id: inventoryItem.inventory_item_id,
                    location_id: location.location_id,
                    quantity: item.quantity,
                    line_item_id: item.id,
                    metadata: {
                      order_id: order.id,
                      created_by: "complete_cart_endpoint",
                    },
                  },
                ]);

                console.log(
                  `[Complete Cart] ✅ Reserved ${item.quantity}x of item ${item.id}`,
                );
              }
            }
          }
        }

        console.log("[Complete Cart] ✅ Inventory reservations created");
      } catch (inventoryError: any) {
        console.error(
          "[Complete Cart] ⚠️ Inventory error:",
          inventoryError.message,
        );
      }

      // Emit order.placed event for notifications
      try {
        console.log("[Complete Cart] Emitting order.placed event...");

        const eventBusModuleService = req.scope.resolve(Modules.EVENT_BUS);

        await eventBusModuleService.emit({
          name: "order.placed",
          data: { id: order.id },
        });

        console.log(
          "[Complete Cart] ✅ order.placed event emitted - notifications will be sent",
        );
      } catch (eventError: any) {
        console.error(
          "[Complete Cart] ⚠️ Failed to emit event:",
          eventError.message,
        );
      }

      // Delete the cart
      try {
        const cartModuleService = req.scope.resolve(Modules.CART);
        await cartModuleService.deleteCarts(cart_id);
        console.log("[Complete Cart] ✅ Cart deleted");
      } catch (deleteError: any) {
        console.error(
          "[Complete Cart] ⚠️ Failed to delete cart:",
          deleteError.message,
        );
      }

      res.status(200).json({
        type: "order",
        order: order,
      });
      return;
    }

    // No item selection - use standard complete cart workflow
    console.log("[Complete Cart] No item selection - using all cart items");

    // Check if payment collection exists
    if (!cart.payment_collection) {
      console.error("[Complete Cart] ❌ No payment collection found on cart");
      res.status(400).json({
        error:
          "Payment collection not found. Please initialize payment method first.",
      });
      return;
    }

    console.log("[Complete Cart] Payment collection:", {
      id: cart.payment_collection.id,
      status: cart.payment_collection.status,
      payment_sessions_count:
        cart.payment_collection.payment_sessions?.length || 0,
    });

    // Check if payment session exists and authorize if needed
    if (cart.payment_collection.payment_sessions?.length > 0) {
      const paymentSession = cart.payment_collection.payment_sessions[0];

      console.log("[Complete Cart] Payment session:", {
        id: paymentSession.id,
        status: paymentSession.status,
        provider_id: paymentSession.provider_id,
      });

      // If payment session is not authorized, authorize it (for COD)
      if (
        paymentSession.status !== "authorized" &&
        paymentSession.status !== "captured"
      ) {
        console.log("[Complete Cart] Authorizing payment session...");

        try {
          const paymentModuleService = req.scope.resolve(Modules.PAYMENT);

          await paymentModuleService.authorizePaymentSession(
            paymentSession.id,
            {},
          );

          console.log("[Complete Cart] ✅ Payment session authorized");
        } catch (authError: any) {
          console.error(
            "[Complete Cart] ⚠️ Authorization failed:",
            authError.message,
          );
          // Continue - completeCartWorkflow will handle authorization
        }
      } else {
        console.log(
          "[Complete Cart] Payment session already authorized/captured",
        );
      }
    } else {
      console.error(
        "[Complete Cart] ❌ No payment sessions found in payment collection",
      );
      res.status(400).json({
        error:
          "No payment sessions found. Please select a payment method and try again.",
      });
      return;
    }

    // Complete cart using standard Medusa flow
    console.log("[Complete Cart] Completing cart...");

    const { result } = await completeCartWorkflow(req.scope).run({
      input: { id: cart_id },
    });

    console.log("[Complete Cart] ✅ Cart completed:", {
      type: result.type,
      order_id: result.type === "order" ? result.order.id : null,
    });

    res.status(200).json(result);
  } catch (error: any) {
    console.error("[Complete Cart] Error:", error.message);
    console.error("[Complete Cart] Stack:", error.stack);

    res.status(500).json({
      error: error.message || "Failed to complete cart",
    });
  }
}
