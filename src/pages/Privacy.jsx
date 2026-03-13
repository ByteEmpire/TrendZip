import LegalLayout, { Section, P, UL } from '@/components/layout/LegalLayout'

export default function PrivacyPolicy() {
  return (
    <LegalLayout
      title="Privacy Policy"
      subtitle="How TrendZip collects, uses, and protects your personal information."
      updated="January 1, 2025"
    >
      <Section title="1. Information We Collect">
        <P>We collect information you provide directly to us when you create an account, place an order, or contact us. This includes:</P>
        <UL items={[
          'Name, email address, and password when registering',
          'Billing and shipping address when placing an order',
          'Payment information (processed securely by Razorpay — we never store your card details)',
          'Phone number for delivery coordination',
          'Communications you send to our support team',
        ]} />
      </Section>

      <Section title="2. Information Collected Automatically">
        <P>When you use our website, we automatically collect certain information about your device and usage, including:</P>
        <UL items={[
          'Browser type, operating system, and device identifiers',
          'IP address and approximate location',
          'Pages visited, time spent, and links clicked',
          'Referring URLs and search terms',
        ]} />
      </Section>

      <Section title="3. How We Use Your Information">
        <P>We use the information we collect to:</P>
        <UL items={[
          'Process and fulfil your orders and send order confirmations',
          'Communicate with you about your orders and account',
          'Send promotional communications (only with your consent)',
          'Improve and personalise your shopping experience',
          'Prevent fraud and ensure platform security',
          'Comply with legal obligations',
        ]} />
      </Section>

      <Section title="4. Sharing Your Information">
        <P>We do not sell your personal information. We share information only with trusted third parties necessary to operate our business:</P>
        <UL items={[
          'Delivery partners (Delhivery, DTDC, Bluedart) for order fulfilment',
          'Payment processors (Razorpay) for secure transactions',
          'Cloud infrastructure providers (Supabase, Vercel)',
          'Analytics tools to understand site usage (anonymised)',
        ]} />
      </Section>

      <Section title="5. Data Retention">
        <P>We retain your account information for as long as your account is active. Order records are kept for 7 years for accounting and legal purposes. You may request deletion of your personal data at any time by contacting us at privacy@trendzip.in.</P>
      </Section>

      <Section title="6. Your Rights">
        <P>You have the right to access, correct, or delete your personal information. You may also object to or restrict certain processing. To exercise these rights, contact us at privacy@trendzip.in. We will respond within 30 days.</P>
      </Section>

      <Section title="7. Security">
        <P>We implement industry-standard security measures including TLS encryption for data in transit and encrypted storage for sensitive data. However, no method of transmission over the internet is 100% secure.</P>
      </Section>

      <Section title="8. Contact">
        <P>If you have questions about this Privacy Policy, contact our Data Protection Officer at privacy@trendzip.in or write to us at TrendZip, Mumbai, Maharashtra, India.</P>
      </Section>
    </LegalLayout>
  )
}