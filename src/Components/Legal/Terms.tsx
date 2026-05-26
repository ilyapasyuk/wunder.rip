import { Link } from 'react-router-dom'

const Terms = () => {
  return (
    <main className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-10 text-text-primary dark:text-text-dark-primary">
      <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-2">Terms of Service</h1>
      <p className="text-sm text-text-secondary dark:text-text-dark-secondary mb-8">
        Last updated: May 2026
      </p>

      <Section title="1. The service">
        <p>
          Wunder.rip is a personal task manager. You can create tasks and lists, attach images, and
          access them from any device. The service is provided as-is, free of charge, with no
          guarantees of availability or data preservation.
        </p>
      </Section>

      <Section title="2. Account">
        <p>
          You sign in with a Google account. We do not manage passwords — authentication is handled
          by Google. By signing in, you confirm that you are authorized to use that account.
        </p>
      </Section>

      <Section title="3. Your content">
        <p>You own everything you create or upload. By using the service, you agree that:</p>
        <ul className="list-disc pl-6 mt-2 space-y-1">
          <li>You will not upload illegal, harmful, or content you have no right to share.</li>
          <li>
            Uploaded images are stored on a public URL on Cloudinary. Anyone with the link can view
            them. Do not upload anything you consider sensitive or private.
          </li>
          <li>
            We may remove content or suspend accounts that violate these terms or applicable law.
          </li>
        </ul>
      </Section>

      <Section title="4. Availability and changes">
        <p>
          The service may change, become unavailable, or be discontinued at any time. We try to
          avoid disruptions, but cannot promise zero downtime or data loss. Keep your own copies of
          anything important.
        </p>
      </Section>

      <Section title="5. Liability">
        <p>
          To the maximum extent permitted by law, we are not liable for any damages arising from
          your use of the service, including lost data, downtime, or content removed by us or our
          third-party providers.
        </p>
      </Section>

      <Section title="6. Deleting your account">
        <p>
          To delete your account and associated data, contact us (see the footer). Signing out does
          not delete your data.
        </p>
      </Section>

      <Section title="7. Privacy">
        <p>
          How we handle your data is described in our{' '}
          <Link to="/privacy" className="text-primary hover:underline">
            Privacy Policy
          </Link>
          .
        </p>
      </Section>
    </main>
  )
}

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="mb-6">
    <h2 className="text-lg font-medium mb-2">{title}</h2>
    <div className="text-sm leading-relaxed text-text-primary/90 dark:text-text-dark-primary/90">
      {children}
    </div>
  </section>
)

export { Terms }
