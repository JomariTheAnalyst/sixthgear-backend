import {
  Body,
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

type OrderPlacedEmailProps = {
  order: OrderDTO & {
    customer: CustomerDTO;
  };
};

/**
 * Order Confirmation Email Template
 *
 * Sent when a customer successfully places an order.
 * Features:
 * - SixthGear branding (black/white/gray)
 * - Order details with items and totals
 * - Shipping and billing information
 * - Mobile-responsive design
 */
function OrderPlacedEmailComponent({ order }: OrderPlacedEmailProps) {
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
          Thank you for your order from SixthGear - Order #
          {String(order.display_id)}
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
            {/* Thank You Message */}
            <Heading className="text-2xl font-bold text-gray-900 mb-2">
              Thank You for Your Order!
            </Heading>
            <Text className="text-gray-600 text-base mb-6">
              Hi {customerName}, we've received your order and will process it
              shortly. You'll receive another email when your order ships.
            </Text>

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
                    Order Date
                  </Text>
                  <Text className="text-base font-semibold text-gray-900 m-0">
                    {new Date(order.created_at).toLocaleDateString()}
                  </Text>
                </Column>
              </Row>
            </Section>

            {/* Order Items */}
            <Heading className="text-xl font-semibold text-gray-900 mb-4 mt-8">
              Order Items
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

            {/* Payment Information */}
            <Section className="mt-8 bg-gray-50 rounded-lg p-4">
              <Heading className="text-xl font-semibold text-gray-900 mb-3">
                Payment Information
              </Heading>

              {(() => {
                // Extract payment information from order
                const paymentCollection = (order as any)
                  .payment_collections?.[0];
                const payment = paymentCollection?.payments?.[0];
                const paymentProvider = payment?.provider_id || "manual";
                const isStripe = paymentProvider === "stripe";
                const isCOD =
                  paymentProvider === "manual" || paymentProvider === "cod";

                if (isStripe) {
                  return (
                    <>
                      <Row className="mb-2">
                        <Column>
                          <Text className="text-base text-gray-600 m-0">
                            Payment Method
                          </Text>
                        </Column>
                        <Column align="right">
                          <Text className="text-base font-semibold text-gray-900 m-0">
                            Credit/Debit Card (Stripe)
                          </Text>
                        </Column>
                      </Row>
                      <Row>
                        <Column>
                          <Text className="text-base text-gray-600 m-0">
                            Payment Status
                          </Text>
                        </Column>
                        <Column align="right">
                          <Text className="text-base font-semibold text-green-600 m-0">
                            ✓ Payment Confirmed
                          </Text>
                        </Column>
                      </Row>
                      <Section className="mt-3 pt-3 border-t border-gray-300">
                        <Text className="text-sm text-gray-600 m-0">
                          Your payment has been successfully processed. You will
                          see the charge on your statement as "SixthGear".
                        </Text>
                      </Section>
                    </>
                  );
                } else if (isCOD) {
                  return (
                    <>
                      <Row className="mb-2">
                        <Column>
                          <Text className="text-base text-gray-600 m-0">
                            Payment Method
                          </Text>
                        </Column>
                        <Column align="right">
                          <Text className="text-base font-semibold text-gray-900 m-0">
                            Cash on Delivery (COD)
                          </Text>
                        </Column>
                      </Row>
                      <Row>
                        <Column>
                          <Text className="text-base text-gray-600 m-0">
                            Payment Status
                          </Text>
                        </Column>
                        <Column align="right">
                          <Text className="text-base font-semibold text-orange-600 m-0">
                            Payment Pending
                          </Text>
                        </Column>
                      </Row>
                      <Section className="mt-3 pt-3 border-t border-gray-300 bg-orange-50 rounded p-3">
                        <Text className="text-base font-semibold text-gray-900 m-0 mb-2">
                          ⚠️ Important: Please Prepare Exact Amount
                        </Text>
                        <Text className="text-sm text-gray-700 m-0 mb-2">
                          Total amount to pay:{" "}
                          <span className="font-bold text-lg">
                            {formatPrice(order.total)}
                          </span>
                        </Text>
                        <Text className="text-sm text-gray-600 m-0">
                          Please have the exact amount ready when our delivery
                          partner arrives. This helps ensure a smooth and quick
                          delivery process.
                        </Text>
                      </Section>
                    </>
                  );
                } else {
                  return (
                    <Row>
                      <Column>
                        <Text className="text-base text-gray-600 m-0">
                          Payment Method
                        </Text>
                      </Column>
                      <Column align="right">
                        <Text className="text-base font-semibold text-gray-900 m-0">
                          {paymentProvider}
                        </Text>
                      </Column>
                    </Row>
                  );
                }
              })()}
            </Section>

            {/* Order Summary */}
            <Section className="mt-8">
              <Heading className="text-xl font-semibold text-gray-900 mb-4">
                Order Summary
              </Heading>

              <Row className="mb-2">
                <Column>
                  <Text className="text-base text-gray-600 m-0">Subtotal</Text>
                </Column>
                <Column align="right">
                  <Text className="text-base text-gray-900 m-0">
                    {formatPrice(order.item_total)}
                  </Text>
                </Column>
              </Row>

              {order.shipping_methods?.map((method) => (
                <Row key={method.id} className="mb-2">
                  <Column>
                    <Text className="text-base text-gray-600 m-0">
                      {method.name}
                    </Text>
                  </Column>
                  <Column align="right">
                    <Text className="text-base text-gray-900 m-0">
                      {formatPrice(method.total)}
                    </Text>
                  </Column>
                </Row>
              ))}

              <Row className="mb-2">
                <Column>
                  <Text className="text-base text-gray-600 m-0">Tax</Text>
                </Column>
                <Column align="right">
                  <Text className="text-base text-gray-900 m-0">
                    {formatPrice(order.tax_total || 0)}
                  </Text>
                </Column>
              </Row>

              <Row className="border-t border-gray-300 pt-3 mt-3">
                <Column>
                  <Text className="text-lg font-bold text-gray-900 m-0">
                    Total
                  </Text>
                </Column>
                <Column align="right">
                  <Text className="text-lg font-bold text-gray-900 m-0">
                    {formatPrice(order.total)}
                  </Text>
                </Column>
              </Row>
            </Section>

            {/* Shipping Address */}
            {order.shipping_address && (
              <Section className="mt-8">
                <Heading className="text-xl font-semibold text-gray-900 mb-3">
                  Shipping Address
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
export const orderPlacedEmail = (props: OrderPlacedEmailProps) => (
  <OrderPlacedEmailComponent {...props} />
);
