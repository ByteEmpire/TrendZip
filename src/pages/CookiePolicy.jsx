import LegalLayout, { Section, P, UL } from '@/components/layout/LegalLayout'

export default function CookiePolicy() {
  return (
    <LegalLayout
      title="Cookie Policy"
      subtitle="How and why TrendZip uses cookies on our website."
      updated="January 1, 2025"
    >
      <Section title="What Are Cookies?">
        <P>Cookies are small text files placed on your device when you visit a website. They help websites remember your preferences, keep you logged in, and understand how you use the site.</P>
      </Section>

      <Section title="Cookies We Use">
        <P><strong className="text-tz-white">Essential Cookies</strong> — Required for the platform to function. These include authentication tokens that keep you signed in and cart session data. These cannot be disabled.</P>
        <P><strong className="text-tz-white">Functional Cookies</strong> — Remember your preferences such as wishlist items, recently viewed products, and language settings.</P>
        <P><strong className="text-tz-white">Analytics Cookies</strong> — Help us understand how visitors use our site (page views, traffic sources, bounce rates). Data is anonymised and aggregated.</P>
      </Section>

      <Section title="Specific Cookies We Set">
        <UL items={[
          'trendzip-cart — stores your cart items locally (expires: 30 days)',
          'trendzip-wishlist — stores your wishlist locally (expires: 30 days)',
          'sb-auth-token — Supabase authentication session (expires: 1 hour, auto-refreshed)',
          '__vercel_toolbar — Vercel deployment tool (dev environments only)',
        ]} />
      </Section>

      <Section title="Third-Party Cookies">
        <P>We use services that may set their own cookies:</P>
        <UL items={[
          'Google Analytics — anonymised usage analytics',
          'Razorpay — secure payment processing',
          'Supabase — database authentication',
        ]} />
      </Section>

      <Section title="Managing Cookies">
        <P>You can control cookies through your browser settings. Most browsers allow you to refuse new cookies, delete existing cookies, and be notified when a new cookie is set. Note that disabling essential cookies will prevent you from using core features like signing in and checkout.</P>
      </Section>

      <Section title="Contact">
        <P>Questions about our use of cookies? Email us at privacy@trendzip.in.</P>
      </Section>
    </LegalLayout>
  )
}