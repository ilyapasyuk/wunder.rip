import {
  ArrowPathIcon,
  BoltIcon,
  CalendarDaysIcon,
  DevicePhoneMobileIcon,
  LifebuoyIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline'
import { Link } from 'react-router-dom'
import { ROUTE } from 'routes'

const FEATURES = [
  {
    icon: CalendarDaysIcon,
    title: 'Plan your day',
    description:
      'Today with an evening section, Upcoming, Someday, deadlines, reminders and repeating tasks.',
  },
  {
    icon: BoltIcon,
    title: 'Type it like you say it',
    description: '“Call mom tomorrow at 9 #family” — the day, time and tags are filled in for you.',
  },
  {
    icon: DevicePhoneMobileIcon,
    title: 'Widgets, Watch & Siri',
    description:
      'Tick off tasks from an interactive widget or your Apple Watch, add one with Siri or the share sheet.',
  },
  {
    icon: ArrowPathIcon,
    title: 'Synced with the web',
    description:
      'Sign in with Apple or Google — the same tasks on iPhone, iPad and notes.pasyuk.com, even offline.',
  },
  {
    icon: SparklesIcon,
    title: 'Works with AI assistants',
    description: 'Connect Claude or any MCP client and let it plan and update your tasks.',
  },
  {
    icon: LifebuoyIcon,
    title: 'Free, no ads, no tracking',
    description:
      'No subscription, no ads, no sale of your data. See the Privacy Policy for details.',
  },
]

const Ios = () => {
  return (
    <main className="text-text-primary dark:text-text-dark-primary">
      <section className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 pt-16 pb-12 text-center">
        <span
          aria-hidden="true"
          className="mx-auto size-16 rounded-3xl bg-ink flex items-center justify-center text-on-ink font-medium text-2xl tracking-tight shadow-md"
        >
          W
        </span>
        <h1 className="mt-6 text-3xl sm:text-4xl font-semibold tracking-tight">
          Wunder<span className="text-primary">.rip</span> for iOS
        </h1>
        <p className="mt-3 text-base sm:text-lg text-text-secondary dark:text-text-dark-secondary max-w-xl mx-auto">
          A fast, free, native planner for iPhone, iPad and Apple Watch — synced with the web app
          you already use.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <span className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-md text-sm font-medium border border-border dark:border-border-dark text-text-secondary dark:text-text-dark-secondary whitespace-nowrap">
            Coming soon on the App Store
          </span>
          <a
            href="https://notes.pasyuk.com"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium bg-ink text-on-ink hover:bg-ink-soft focus:outline-none focus:ring-2 focus:ring-ink/25 focus:ring-offset-2 focus:ring-offset-background dark:focus:ring-offset-background-dark transition-colors whitespace-nowrap"
          >
            Try it on the web
          </a>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="rounded-lg border border-border-light dark:border-border-dark bg-surface dark:bg-surface-dark p-5"
            >
              <Icon className="size-6 text-primary" aria-hidden="true" />
              <h2 className="mt-3 text-sm font-semibold">{title}</h2>
              <p className="mt-1 text-sm text-text-secondary dark:text-text-dark-secondary leading-relaxed">
                {description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-border-light dark:border-border-dark bg-surface dark:bg-surface-dark">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12 text-center">
          <h2 className="text-xl font-semibold tracking-tight">Need help?</h2>
          <p className="mt-2 text-sm text-text-secondary dark:text-text-dark-secondary">
            Visit the support page for how to get in touch, or check the legal pages below.
          </p>
          <div className="mt-6 flex items-center justify-center gap-2 flex-wrap">
            <Link
              to={ROUTE.SUPPORT}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-ink text-on-ink hover:bg-ink-soft focus:outline-none focus:ring-2 focus:ring-ink/25 focus:ring-offset-2 focus:ring-offset-surface dark:focus:ring-offset-surface-dark transition-colors"
            >
              Support
            </Link>
            <Link
              to={ROUTE.PRIVACY}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium border border-border dark:border-border-dark hover:bg-overlay-hover transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              to={ROUTE.TERMS}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium border border-border dark:border-border-dark hover:bg-overlay-hover transition-colors"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}

export { Ios }
