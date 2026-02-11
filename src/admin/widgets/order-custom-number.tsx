import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { DetailWidgetProps, AdminOrder } from "@medusajs/framework/types";
import { Container, Heading, Text, Badge } from "@medusajs/ui";

/**
 * Order Custom Number Widget
 *
 * Displays the custom order number (SIX-000123) prominently on the order details page.
 * This widget appears at the top of the order details page.
 */
const OrderCustomNumberWidget = ({ data }: DetailWidgetProps<AdminOrder>) => {
  const order = data;

  // Generate custom order number if not set
  const customOrderNumber =
    order.custom_display_id ||
    `SIX-${String(order.display_id).padStart(6, "0")}`;

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex flex-col gap-y-1">
          <Heading level="h2">Order Number</Heading>
          <Text className="text-ui-fg-subtle" size="small">
            Customer-facing order number
          </Text>
        </div>
        <Badge size="large" className="text-lg font-mono">
          {customOrderNumber}
        </Badge>
      </div>
    </Container>
  );
};

export const config = defineWidgetConfig({
  zone: "order.details.before",
});

export default OrderCustomNumberWidget;
