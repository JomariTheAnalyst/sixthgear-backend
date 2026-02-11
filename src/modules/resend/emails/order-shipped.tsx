import {
  Body,
  Button,
  Container,
  Column,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Row,
  Section,
  Text,
  Tailwind,
} from "@react-email/components";
import {
  BigNumberValue,
  CustomerDTO,
  OrderDTO,
} from "@medusajs/framework/types";

type OrderShippedEmailProps = {
  order: OrderDTO & {
    customer: CustomerDTO;
  };
  trackingNumber?: string;
  trackingUrl?: string;
  carrier?: string;
};

/**
 * Order Shipped Email Template
 *
 * Sent when an order has been shipped.
 * Features:
 * - SixthGear branding (black/white/gray)
 * - Tracking information
 * - Order summary
 * - Estimated delivery date
 * - Mobile-responsive design
 */
function OrderShippedEmailComponent({
  order,
  trackingNumber,
  trackingUrl,
  carrier,
}: OrderShippedEmailProps) {
  // Format currency values
  const formatter = new Intl.NumberFormat([], {
    style: "currency",
    currencyDisplay: "narrowSymbol",
    currency: order.currency_code,
  });

  const formatPrice = (price: BigNumberValue) => {
    if (typeof price === "number") {
      return formatter.format(price);
    }

    if (typeof price === "string") {
      return formatter.format(parseFloat(price));
    }

    return price?.toString() || "";
  };

  // Get customer name
  const customerName =
    order.customer?.first_name ||
    order.shipping_address?.first_name ||
    "Valued Customer";

  return (
    <Tailwind>
      <Html className="font-sans bg-gray-50">
        <Head />
        <Preview>
          Your SixthGear order{" "}
          {order.custom_display_id || `#${order.display_id}`} has been shipped!
        </Preview>
        <Body className="bg-gray-50 my-10 mx-auto w-full max-w-2xl">
          {/* Header - SixthGear Branding */}
          <Section className="bg-black text-white px-8 py-6">
            <Heading className="text-3xl font-bold text-center m-0 tracking-wider">
              SIXTHGEAR
            </Heading>
            <Text className="text-center text-gray-400 text-sm mt-2 m-0">
              Premium Motorcycle Gear & Accessories
            </Text>
          </Section>

          {/* Main Content */}
          <Container className="bg-white px-8 py-8">
            {/* Shipped Message */}
            <Section className="text-center mb-6">
              <Text className="text-5xl m-0 mb-3">📦</Text>
              <Heading className="text-2xl font-bold text-gray-900 mb-2">
                Your Order Has Shipped!
              </Heading>
              <Text className="text-gray-600 text-base mb-2">
                Hi {customerName}, great news! Your order is on its way.
              </Text>
            </Section>

            {/* Order Info */}
            <Section className="bg-gray-50 rounded-lg p-4 mb-6">
              <Row>
                <Column>
                  <Text className="text-sm text-gray-600 m-0 mb-1">
                    Order Number
                  </Text>
                  <Text className="text-base font-semibold text-gray-900 m-0">
                    {order.custom_display_id || `#${order.display_id}`}
                  </Text>
                </Column>
                <Column align="right">
                  <Text className="text-sm text-gray-600 m-0 mb-1">
                    Shipped Date
                  </Text>
                  <Text className="text-base font-semibold text-gray-900 m-0">
                    {new Date().toLocaleDateString()}
                  </Text>
                </Column>
              </Row>
            </Section>

            {/* Tracking Information */}
            {trackingNumber && (
              <Section className="bg-green-50 border-l-4 border-green-500 p-4 mb-6">
                <Heading className="text-xl font-semibold text-gray-900 mb-3">
                  📍 Tracking Information
                </Heading>
                {carrier && (
                  <Row className="mb-2">
                    <Column>
                      <Text className="text-base text-gray-600 m-0">
                        Carrier
                      </Text>
                    </Column>
                    <Column align="right">
                      <Text className="text-base font-semibold text-gray-900 m-0">
                        {carrier}
                      </Text>
                    </Column>
                  </Row>
                )}
                <Row className="mb-3">
                  <Column>
                    <Text className="text-base text-gray-600 m-0">
                      Tracking Number
                    </Text>
                  </Column>
                  <Column align="right">
                    <Text className="text-base font-semibold text-gray-900 m-0">
                      {trackingNumber}
                    </Text>
                  </Column>
                </Row>
                {trackingUrl && (
                  <Section className="text-center mt-4">
                    <Button
                      href={trackingUrl}
                      className="bg-black text-white px-6 py-3 rounded-md text-base font-semibold no-underline inline-block"
                    >
                      Track Your Package
                    </Button>
                  </Section>
                )}
              </Section>
            )}

            {/* Order Items */}
            <Heading className="text-xl font-semibold text-gray-900 mb-4 mt-8">
              Items in This Shipment
            </Heading>

            {order.items?.map((item) => (
              <Section key={item.id} className="border-b border-gray-200 py-4">
                <Row>
                  <Column style={{ width: "80px", verticalAlign: "top" }}>
                    {item.thumbnail && (
                      <Img
                        src={item.thumbnail}
                        alt={item.product_title ?? ""}
                        className="rounded-md"
                        width="80"
                        height="80"
                        style={{ objectFit: "cover" }}
                      />
                    )}
                  </Column>
                  <Column style={{ paddingLeft: "16px", verticalAlign: "top" }}>
                    <Text className="text-base font-semibold text-gray-900 m-0 mb-1">
                      {item.product_title}
                    </Text>
                    {item.variant_title && (
                      <Text className="text-sm text-gray-600 m-0 mb-2">
                        {item.variant_title}
                      </Text>
                    )}
                    <Text className="text-sm text-gray-600 m-0">
                      Quantity: {item.quantity}
                    </Text>
                  </Column>
                  <Column align="right" style={{ verticalAlign: "top" }}>
                    <Text className="text-base font-semibold text-gray-900 m-0">
                      {formatPrice(item.total)}
                    </Text>
                  </Column>
                </Row>
              </Section>
            ))}

            {/* Shipping Address */}
            {order.shipping_address && (
              <Section className="mt-8">
                <Heading className="text-xl font-semibold text-gray-900 mb-3">
                  Shipping To
                </Heading>
                <Text className="text-base text-gray-700 m-0 mb-1">
                  {order.shipping_address.first_name}{" "}
                  {order.shipping_address.last_name}
                </Text>
                <Text className="text-base text-gray-700 m-0 mb-1">
                  {order.shipping_address.address_1}
                </Text>
                {order.shipping_address.address_2 && (
                  <Text className="text-base text-gray-700 m-0 mb-1">
                    {order.shipping_address.address_2}
                  </Text>
                )}
                <Text className="text-base text-gray-700 m-0">
                  {order.shipping_address.city},{" "}
                  {order.shipping_address.province}{" "}
                  {order.shipping_address.postal_code}
                </Text>
                <Text className="text-base text-gray-700 m-0">
                  {order.shipping_address.country_code?.toUpperCase()}
                </Text>
              </Section>
            )}

            {/* Delivery Notice */}
            <Section className="bg-gray-50 rounded-lg p-4 mt-8">
              <Text className="text-base text-gray-700 m-0 mb-2">
                📅 <strong>Estimated Delivery:</strong> 3-5 business days
              </Text>
              <Text className="text-sm text-gray-600 m-0">
                Please note that delivery times may vary depending on your
                location and local courier schedules.
              </Text>
            </Section>
          </Container>

          {/* Footer */}
          <Section className="bg-gray-100 px-8 py-6 mt-8">
            <Text className="text-center text-gray-600 text-sm mb-3">
              Questions or concerns? Message us:
            </Text>
            <Text className="text-center text-gray-700 text-base font-semibold mb-1">
              📱 0995 093 0157
            </Text>
            <Text className="text-center text-gray-700 text-base font-semibold mb-4">
              💬{" "}
              <a
                href="https://www.facebook.com/camille.sixthgear"
                style={{ color: "#000000", textDecoration: "underline" }}
              >
                facebook.com/camille.sixthgear
              </a>
            </Text>
            <Text className="text-center text-gray-500 text-xs mb-2">
              Order ID: {order.id}
            </Text>
            <Text className="text-center text-gray-400 text-xs m-0">
              © {new Date().getFullYear()} SixthGear. All rights reserved.
            </Text>
          </Section>
        </Body>
      </Html>
    </Tailwind>
  );
}

/**
 * Export the email template function
 * This is what gets registered in the service
 */
export const orderShippedEmail = (props: OrderShippedEmailProps) => (
  <OrderShippedEmailComponent {...props} />
);
