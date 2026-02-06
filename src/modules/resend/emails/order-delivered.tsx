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

type OrderDeliveredEmailProps = {
  order: OrderDTO & {
    customer: CustomerDTO;
  };
  deliveredDate?: Date;
};

/**
 * Order Delivered Email Template
 *
 * Sent when an order has been successfully delivered.
 * Features:
 * - SixthGear branding (black/white/gray)
 * - Delivery confirmation
 * - Order summary
 * - Feedback request
 * - Mobile-responsive design
 */
function OrderDeliveredEmailComponent({
  order,
  deliveredDate,
}: OrderDeliveredEmailProps) {
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

  const deliveryDateStr = deliveredDate
    ? new Date(deliveredDate).toLocaleDateString()
    : new Date().toLocaleDateString();

  return (
    <Tailwind>
      <Html className="font-sans bg-gray-50">
        <Head />
        <Preview>
          Your SixthGear order #{String(order.display_id)} has been delivered!
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
            {/* Delivered Message */}
            <Section className="text-center mb-6">
              <Text className="text-5xl m-0 mb-3">✅</Text>
              <Heading className="text-2xl font-bold text-gray-900 mb-2">
                Your Order Has Been Delivered!
              </Heading>
              <Text className="text-gray-600 text-base mb-2">
                Hi {customerName}, your order has been successfully delivered.
                We hope you love your new gear!
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
                    #{order.display_id}
                  </Text>
                </Column>
                <Column align="right">
                  <Text className="text-sm text-gray-600 m-0 mb-1">
                    Delivered Date
                  </Text>
                  <Text className="text-base font-semibold text-gray-900 m-0">
                    {deliveryDateStr}
                  </Text>
                </Column>
              </Row>
            </Section>

            {/* Delivery Confirmation */}
            <Section className="bg-green-50 border-l-4 border-green-500 p-4 mb-6">
              <Text className="text-base font-semibold text-gray-900 m-0 mb-2">
                ✅ Delivery Confirmed
              </Text>
              <Text className="text-sm text-gray-700 m-0">
                Your package has been successfully delivered to your address. If
                you haven't received it, please check with your household
                members or building security.
              </Text>
            </Section>

            {/* Order Items */}
            <Heading className="text-xl font-semibold text-gray-900 mb-4 mt-8">
              Items Delivered
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

            {/* Order Total */}
            <Section className="mt-6">
              <Row className="border-t border-gray-300 pt-3">
                <Column>
                  <Text className="text-lg font-bold text-gray-900 m-0">
                    Total Paid
                  </Text>
                </Column>
                <Column align="right">
                  <Text className="text-lg font-bold text-gray-900 m-0">
                    {formatPrice(order.total)}
                  </Text>
                </Column>
              </Row>
            </Section>

            {/* Feedback Request */}
            <Section className="bg-gray-50 rounded-lg p-6 mt-8 text-center">
              <Text className="text-xl m-0 mb-3">⭐⭐⭐⭐⭐</Text>
              <Heading className="text-lg font-semibold text-gray-900 mb-2">
                How Was Your Experience?
              </Heading>
              <Text className="text-base text-gray-600 mb-4">
                We'd love to hear your feedback! Your review helps us improve
                and helps other riders make informed decisions.
              </Text>
              <Text className="text-sm text-gray-600 m-0">
                Share your experience on our Facebook page or send us a message!
              </Text>
            </Section>

            {/* Support Notice */}
            <Section className="mt-8">
              <Text className="text-base text-gray-700 m-0 mb-2">
                <strong>Need Help?</strong>
              </Text>
              <Text className="text-sm text-gray-600 m-0 mb-1">
                • If you have any issues with your order, please contact us
                immediately
              </Text>
              <Text className="text-sm text-gray-600 m-0 mb-1">
                • For returns or exchanges, please reach out within 7 days of
                delivery
              </Text>
              <Text className="text-sm text-gray-600 m-0">
                • We're here to ensure you're completely satisfied with your
                purchase
              </Text>
            </Section>

            {/* Thank You */}
            <Section className="text-center mt-8 pt-6 border-t border-gray-200">
              <Text className="text-lg font-semibold text-gray-900 mb-2">
                Thank You for Choosing SixthGear!
              </Text>
              <Text className="text-base text-gray-600 m-0">
                We appreciate your business and look forward to serving you
                again.
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
export const orderDeliveredEmail = (props: OrderDeliveredEmailProps) => (
  <OrderDeliveredEmailComponent {...props} />
);
