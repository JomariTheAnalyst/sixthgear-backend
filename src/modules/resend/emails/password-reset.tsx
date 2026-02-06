import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Tailwind,
} from "@react-email/components";

type PasswordResetEmailProps = {
  resetToken: string;
  customerName?: string;
  resetUrl: string;
};

/**
 * Password Reset Email Template
 *
 * Sent when a customer requests to reset their password.
 * Features:
 * - SixthGear branding (black/white/gray)
 * - Secure reset link with token
 * - Clear instructions
 * - Security notice
 * - Mobile-responsive design
 */
function PasswordResetEmailComponent({
  resetToken,
  customerName,
  resetUrl,
}: PasswordResetEmailProps) {
  const customerGreeting = customerName || "Valued Customer";

  return (
    <Tailwind>
      <Html className="font-sans bg-gray-50">
        <Head />
        <Preview>Reset your SixthGear password - Action required</Preview>
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
            {/* Title */}
            <Heading className="text-2xl font-bold text-gray-900 mb-2">
              Reset Your Password
            </Heading>
            <Text className="text-gray-600 text-base mb-6">
              Hi {customerGreeting}, we received a request to reset your
              password for your SixthGear account.
            </Text>

            {/* Reset Button */}
            <Section className="text-center my-8">
              <Button
                href={resetUrl}
                className="bg-black text-white px-8 py-4 rounded-md text-base font-semibold no-underline inline-block"
              >
                Reset Password
              </Button>
            </Section>

            {/* Alternative Link */}
            <Text className="text-gray-600 text-sm mb-6">
              If the button above doesn't work, copy and paste this link into
              your browser:
            </Text>
            <Text className="text-gray-700 text-sm mb-8 break-all bg-gray-50 p-3 rounded">
              {resetUrl}
            </Text>

            {/* Security Notice */}
            <Section className="bg-orange-50 border-l-4 border-orange-500 p-4 mb-6">
              <Text className="text-base font-semibold text-gray-900 m-0 mb-2">
                ⚠️ Security Notice
              </Text>
              <Text className="text-sm text-gray-700 m-0 mb-2">
                This password reset link will expire in 1 hour for security
                reasons.
              </Text>
              <Text className="text-sm text-gray-700 m-0">
                If you didn't request this password reset, please ignore this
                email or contact us if you have concerns.
              </Text>
            </Section>

            {/* Additional Info */}
            <Text className="text-gray-600 text-sm mb-2">
              For your security:
            </Text>
            <Text className="text-gray-600 text-sm m-0 mb-1">
              • Never share your password with anyone
            </Text>
            <Text className="text-gray-600 text-sm m-0 mb-1">
              • Use a strong, unique password
            </Text>
            <Text className="text-gray-600 text-sm m-0 mb-6">
              • Enable two-factor authentication when available
            </Text>
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
export const passwordResetEmail = (props: PasswordResetEmailProps) => (
  <PasswordResetEmailComponent {...props} />
);
