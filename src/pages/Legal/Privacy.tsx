import { Link } from 'react-router-dom'

const Privacy = () => {
  return (
    <main className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-10 text-text-primary dark:text-text-dark-primary">
      <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-2">Privacy Policy</h1>
      <p className="text-sm text-text-secondary dark:text-text-dark-secondary mb-8">
        Last updated: July 2026 · Applies to wunder.rip on the web and the wunder.rip iOS app
      </p>

      <Section title="What we collect">
        <ul className="list-disc pl-6 space-y-1">
          <li>
            <span className="font-medium">From your Google account:</span> name, email address, and
            profile picture. We receive these from Google when you sign in.
          </li>
          <li>
            <span className="font-medium">Content you create:</span> tasks, notes, lists/folders,
            and references to images you upload.
          </li>
          <li>
            <span className="font-medium">Content you share (iOS only):</span> text, links, or
            photos you send to the app via the iOS share sheet, so we can create a task from them.
          </li>
          <li>
            <span className="font-medium">Usage events:</span> anonymized analytics about app
            interactions (e.g. logins, task created/viewed) so we can improve the app.
          </li>
          <li>
            <span className="font-medium">Local preferences:</span> theme and sidebar width are
            stored in your browser&apos;s local storage. We do not read this from the server.
          </li>
          <li>
            <span className="font-medium">Camera (iOS only):</span> only accessed if you choose to
            attach a photo to a task — we never access the camera otherwise.
          </li>
        </ul>
      </Section>

      <Section title="Where your data is stored">
        <p>The app relies on third-party services to store and process data:</p>
        <ul className="list-disc pl-6 mt-2 space-y-1">
          <li>
            <span className="font-medium">Firebase Authentication</span> (Google) — manages your
            sign-in identity.
          </li>
          <li>
            <span className="font-medium">Firebase Realtime Database</span> (Google) — stores your
            tasks, notes, and lists.
          </li>
          <li>
            <span className="font-medium">Firebase Analytics</span> (Google) — collects anonymized
            usage events.
          </li>
          <li>
            <span className="font-medium">Cloudinary</span> — hosts uploaded images and delivers
            them to your browser.
          </li>
          <li>
            <span className="font-medium">Vercel</span> — hosts the application itself.
          </li>
        </ul>
      </Section>

      <Section title="On the iOS app">
        <ul className="list-disc pl-6 space-y-1">
          <li>
            <span className="font-medium">Keychain:</span> your sign-in session is stored in the iOS
            Keychain, shared between the main app and the share extension via an app-group/Keychain
            Sharing entitlement, so you stay signed in across launches. It never leaves your device.
          </li>
          <li>
            <span className="font-medium">Share extension:</span> when you share something into
            wunder.rip from another app, the extension only reads the content you chose to share
            (text, a link, or a photo) to create a task. It does not access anything else from the
            source app.
          </li>
        </ul>
      </Section>

      <Section title="Public image URLs">
        <p>
          Every image you upload is served by Cloudinary on a public URL. There is no access
          control: anyone who knows or guesses the link can view the image. Do not upload anything
          you consider sensitive or private.
        </p>
      </Section>

      <Section title="What we do NOT do">
        <ul className="list-disc pl-6 space-y-1">
          <li>We do not sell your data.</li>
          <li>We do not show ads.</li>
          <li>We do not read the content of your tasks for marketing or training purposes.</li>
        </ul>
      </Section>

      <Section title="Cookies and tracking">
        <p>
          We use local storage for user preferences (theme, sidebar width). Firebase Auth uses
          cookies/local storage to keep you signed in. Firebase Analytics may set cookies to
          de-duplicate anonymous events.
        </p>
      </Section>

      <Section title="Your rights">
        <p>
          You can sign out at any time. You can also permanently delete your account and all stored
          data from the{' '}
          <Link to="/account" className="text-primary hover:underline">
            Account page
          </Link>
          . This removes your tasks, notes, and lists from the database, and deletes your Firebase
          Auth identity. Images uploaded to Cloudinary live on public URLs and are not removed by
          this action.
        </p>
      </Section>

      <Section title="Changes">
        <p>
          This policy may change. The current version is always available at{' '}
          <Link to="/privacy" className="text-primary hover:underline">
            /privacy
          </Link>
          . The &ldquo;Last updated&rdquo; date above reflects the most recent revision.
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

export { Privacy }
