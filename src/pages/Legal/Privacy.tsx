import { Link } from 'react-router-dom'

const Privacy = () => {
  return (
    <main className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-10 text-text-primary dark:text-text-dark-primary">
      <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-2">Privacy Policy</h1>
      <p className="text-sm text-text-secondary dark:text-text-dark-secondary mb-8">
        Last updated: November 2026 · Applies to wunder.rip on the web, the wunder.rip iOS app (with
        its widgets, Apple Watch app, Siri shortcut and share extension) and the wunder.rip MCP
        server
      </p>

      <Section title="What we collect">
        <ul className="list-disc pl-6 space-y-1">
          <li>
            <span className="font-medium">Your account:</span> you sign in with Apple or Google. We
            receive your email address and, if you allow it, your name (and, from Google, your
            profile picture). With Sign in with Apple you can choose{' '}
            <span className="font-medium">Hide My Email</span>: we then only get a private relay
            address from Apple, never your real one.
          </li>
          <li>
            <span className="font-medium">Content you create:</span> tasks, notes, lists, tags,
            checklists, dates, reminders, deadlines, repeat rules, and the photos you attach.
          </li>
          <li>
            <span className="font-medium">Content you share (iOS only):</span> text, links, or
            photos you send to the app via the iOS share sheet, so we can create a task from them.
          </li>
          <li>
            <span className="font-medium">Reminders you import (iOS only):</span> if you tap
            &ldquo;Import from Reminders&rdquo;, the app reads your Apple Reminders once, with your
            permission, and saves them as tasks in your account. It does not read them again.
          </li>
          <li>
            <span className="font-medium">Usage events (web only):</span> anonymized analytics about
            web app interactions (e.g. logins, task created/completed) so we can improve the app.
            The iOS app sends no analytics.
          </li>
          <li>
            <span className="font-medium">Local preferences:</span> theme and sidebar width are
            stored in your browser&apos;s local storage. We do not read this from the server.
          </li>
          <li>
            <span className="font-medium">Photos (iOS only):</span> the app only sees the photos you
            pick to attach to a task. It does not browse your library or use the camera.
          </li>
        </ul>
      </Section>

      <Section title="Where your data is stored">
        <p>The app relies on third-party services to store and process data:</p>
        <ul className="list-disc pl-6 mt-2 space-y-1">
          <li>
            <span className="font-medium">Firebase Authentication</span> (Google) — manages your
            sign-in identity (Apple or Google) and your email address.
          </li>
          <li>
            <span className="font-medium">Firebase Realtime Database</span> (Google) — stores your
            tasks, notes, lists, and everything else you put in a task, so it syncs between the web
            app, the iOS app and the MCP server.
          </li>
          <li>
            <span className="font-medium">Firebase Analytics</span> (Google) — collects anonymized
            usage events from the web app only.
          </li>
          <li>
            <span className="font-medium">Cloudinary</span> — hosts the photos you attach and
            delivers them to your devices.
          </li>
          <li>
            <span className="font-medium">Cloudflare</span> — hosts the web app, the API used by the
            iOS widgets, Apple Watch app and Siri shortcut, and the MCP server. Requests pass
            through Cloudflare and may appear in short-lived server logs.
          </li>
        </ul>
      </Section>

      <Section title="On the iOS app">
        <ul className="list-disc pl-6 space-y-1">
          <li>
            <span className="font-medium">Keychain:</span> your sign-in session is stored in the iOS
            Keychain, so you stay signed in across launches. It never leaves your device.
          </li>
          <li>
            <span className="font-medium">Device token:</span> when you sign in, the app gets a
            device token from our server and keeps it in the app&apos;s private storage on your
            iPhone (shared only with its own widgets and extensions). The widgets, the Apple Watch
            app and the Siri &ldquo;Add task&rdquo; shortcut use it to read and change your tasks.
            It is also handed to your paired Apple Watch, expires after 30 days, and is removed when
            you sign out.
          </li>
          <li>
            <span className="font-medium">Offline copy:</span> the app keeps a copy of your tasks
            and lists on the device so it opens instantly and works offline. Signing out or deleting
            your account removes it.
          </li>
          <li>
            <span className="font-medium">Reminders:</span> task reminders are local notifications
            scheduled on your device. We do not send push notifications.
          </li>
          <li>
            <span className="font-medium">Share extension:</span> when you share something into
            wunder.rip from another app, the extension only reads the content you chose to share
            (text, a link, or a photo) to create a task. It does not access anything else from the
            source app.
          </li>
        </ul>
      </Section>

      <Section title="AI assistants (MCP)">
        <p>
          If you connect an AI assistant to the wunder.rip MCP server, it can read and change your
          tasks and lists after you sign in and click Allow. What the assistant does with that data
          is governed by the assistant provider&apos;s own privacy policy. Nothing is shared with an
          assistant unless you connect it yourself.
        </p>
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
          <li>
            We do not track you across other companies&apos; apps or websites, and we do not share
            your data with advertisers or data brokers.
          </li>
          <li>We do not read the content of your tasks for marketing or training purposes.</li>
        </ul>
      </Section>

      <Section title="Cookies and tracking">
        <p>
          We use local storage for user preferences (theme, sidebar width). Firebase Auth uses
          cookies/local storage to keep you signed in. On the web, Firebase Analytics may set
          cookies to de-duplicate anonymous events. The iOS app uses no cookies and no tracking.
        </p>
      </Section>

      <Section title="Your rights">
        <p>
          You can sign out at any time. You can also permanently delete your account and all stored
          data — in the iOS app (Account → Delete Account) or on the web from the{' '}
          <Link to="/account" className="text-primary hover:underline">
            Account page
          </Link>
          . This removes your tasks, notes, and lists from the database, and deletes your Firebase
          Auth identity; with Sign in with Apple, the iOS app also revokes its access to your Apple
          ID. Images uploaded to Cloudinary live on public URLs and are not removed by this action;
          to have them removed, contact us through the{' '}
          <Link to="/support" className="text-primary hover:underline">
            support page
          </Link>
          .
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
