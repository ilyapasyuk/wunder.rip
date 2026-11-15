import { Link } from 'react-router-dom'
import { ROUTE } from 'routes'

const Support = () => {
  return (
    <main className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-10 text-text-primary dark:text-text-dark-primary">
      <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-2">Support</h1>
      <p className="text-sm text-text-secondary dark:text-text-dark-secondary mb-8">
        Wunder.rip is available on the web and as a native iOS app.
      </p>

      <Section title="Get help">
        <p>
          Found a bug, have a question, or want to request a feature? Open an issue on GitHub — this
          is the fastest way to reach us:
        </p>
        <a
          href="https://github.com/ilyapasyuk/wunder.rip/issues"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-ink text-on-ink hover:bg-ink-soft transition-colors"
        >
          github.com/ilyapasyuk/wunder.rip/issues
        </a>
      </Section>

      <Section title="Common questions">
        <div className="space-y-4">
          <div>
            <h3 className="font-medium">Do I need an account?</h3>
            <p>
              Yes — sign in with Apple or Google, using the same account on the iOS app and the web
              app at{' '}
              <a href="https://notes.pasyuk.com" className="text-primary hover:underline">
                notes.pasyuk.com
              </a>
              . Your tasks and lists stay in sync between them. With Sign in with Apple you can hide
              your email address.
            </p>
          </div>
          <div>
            <h3 className="font-medium">How do I delete my account and data?</h3>
            <p>
              In the iOS app, open Account and tap Delete Account. On the web, delete it from the{' '}
              <Link to={ROUTE.ACCOUNT} className="text-primary hover:underline">
                Account page
              </Link>
              . This removes your tasks, notes, and lists, and deletes your sign-in identity.
            </p>
          </div>
          <div>
            <h3 className="font-medium">How does quick entry work?</h3>
            <p>
              Type a task the way you would say it, in English or Russian: &ldquo;Call mom tomorrow
              at 9 #family&rdquo;, &ldquo;Report by friday&rdquo;, &ldquo;Отчёт до пятницы&rdquo;.
              The app picks up the day, the reminder time, the deadline, and the tags.
            </p>
          </div>
          <div>
            <h3 className="font-medium">Widgets, Apple Watch, and Siri</h3>
            <p>
              Add the Today widget to your Home Screen or Lock Screen and tick tasks off right from
              it. The Apple Watch app shows Today and lets you add and complete tasks. Say
              &ldquo;Add a task in wunder.rip&rdquo; to Siri, or use the Add Task action in
              Shortcuts. If a widget or the watch shows nothing, open the iPhone app once while
              signed in.
            </p>
          </div>
          <div>
            <h3 className="font-medium">Can an AI assistant manage my tasks?</h3>
            <p>
              Yes. Connect any MCP client (for example Claude) to{' '}
              <a href="https://notes.pasyuk.com/api/mcp" className="text-primary hover:underline">
                notes.pasyuk.com/api/mcp
              </a>{' '}
              — that page has step-by-step instructions.
            </p>
          </div>
          <div>
            <h3 className="font-medium">What does the share extension do?</h3>
            <p>
              It lets you send text, links, or photos from any app straight into your wunder.rip
              Inbox, without opening the app first.
            </p>
          </div>
          <div>
            <h3 className="font-medium">Is the app free?</h3>
            <p>Yes. wunder.rip is completely free: no ads, no subscription, no in-app purchases.</p>
          </div>
        </div>
      </Section>

      <Section title="Legal">
        <p>
          See the{' '}
          <Link to={ROUTE.PRIVACY} className="text-primary hover:underline">
            Privacy Policy
          </Link>{' '}
          and{' '}
          <Link to={ROUTE.TERMS} className="text-primary hover:underline">
            Terms of Service
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

export { Support }
