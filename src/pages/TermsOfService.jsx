import LegalLayout, { Section, P, UL } from '@/components/layout/LegalLayout'

export default function TermsOfService() {
  return (
    <LegalLayout
      title="Terms of Service"
      subtitle="Please read these terms carefully before using TrendZip."
      updated="January 1, 2025"
    >
      <Section title="1. Acceptance of Terms">
        <P>By accessing or using TrendZip (trendzip.in), you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree, please do not use our services.</P>
      </Section>

      <Section title="2. Use of the Platform">
        <P>You may use TrendZip only for lawful purposes and in accordance with these Terms. You agree not to:</P>
        <UL items={[
          'Use the platform in any way that violates applicable laws or regulations',
          'Attempt to gain unauthorised access to any part of the platform',
          'Transmit any harmful, offensive, or disruptive content',
          'Use automated tools to scrape, crawl, or extract data without permission',
          'Impersonate any person or entity',
        ]} />
      </Section>

      <Section title="3. Account Registration">
        <P>You must provide accurate and complete information when creating an account. You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account. Notify us immediately at support@trendzip.in of any unauthorised use.</P>
      </Section>

      <Section title="4. Products and Pricing">
        <P>We reserve the right to modify product descriptions, prices, and availability at any time without notice. All prices are in Indian Rupees (₹) and inclusive of applicable taxes. We make every effort to display accurate product colours and descriptions, but cannot guarantee that your screen accurately represents actual colours.</P>
      </Section>

      <Section title="5. Orders and Payment">
        <P>An order confirmation email does not constitute acceptance of your order. We reserve the right to cancel orders for reasons including pricing errors, suspected fraud, or stock unavailability. Payment is processed securely by Razorpay.</P>
      </Section>

      <Section title="6. Intellectual Property">
        <P>All content on TrendZip — including logos, images, text, and design — is owned by or licensed to TrendZip and protected by copyright and trademark laws. You may not reproduce or distribute any content without our written permission.</P>
      </Section>

      <Section title="7. Limitation of Liability">
        <P>To the maximum extent permitted by law, TrendZip shall not be liable for any indirect, incidental, or consequential damages arising from your use of the platform or any products purchased. Our total liability shall not exceed the amount paid for the specific order in question.</P>
      </Section>

      <Section title="8. Governing Law">
        <P>These Terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in Mumbai, Maharashtra.</P>
      </Section>

      <Section title="9. Changes to Terms">
        <P>We may update these Terms at any time. Changes will be posted on this page with an updated date. Continued use of the platform after changes constitutes acceptance of the new Terms.</P>
      </Section>

      <Section title="10. Contact">
        <P>Questions about these Terms? Contact us at legal@trendzip.in.</P>
      </Section>
    </LegalLayout>
  )
}