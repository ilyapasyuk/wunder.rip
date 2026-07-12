import {
  ArrowPathIcon,
  ArrowsUpDownIcon,
  FolderIcon,
  LifebuoyIcon,
  LockClosedIcon,
  ShareIcon,
} from '@heroicons/react/24/outline'
import { Link } from 'react-router-dom'
import { ROUTE } from 'routes'

const FEATURES = [
  {
    icon: FolderIcon,
    title: 'Tasks & lists',
    description: 'Organize tasks into folders, add notes, and attach photos to anything.',
  },
  {
    icon: ArrowsUpDownIcon,
    title: 'Drag to reorder',
    description: 'Reorder tasks and folders by hand — order is saved instantly.',
  },
  {
    icon: ShareIcon,
    title: 'Share sheet extension',
    description: 'Send a link, photo, or text from any app straight into your Inbox.',
  },
  {
    icon: ArrowPathIcon,
    title: 'Synced with the web',
    description:
      'Sign in with the same Google account as wunder.rip on the web — everything stays in sync.',
  },
  {
    icon: LockClosedIcon,
    title: 'Stays signed in',
    description:
      'Your session is kept in the iOS Keychain, so you’re not asked to sign in again on every launch.',
  },
  {
    icon: LifebuoyIcon,
    title: 'No ads, no tracking',
    description: 'Free, with no ads and no sale of your data. See the Privacy Policy for details.',
  },
]

const Ios = () => {
  return (
    <main className="text-text-primary dark:text-text-dark-primary">
      <section className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 pt-16 pb-12 text-center">
        <span
          aria-hidden="true"
          className="mx-auto size-16 rounded-2xl bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center text-white font-bold text-2xl tracking-tight shadow-md"
        >
          W
        </span>
        <h1 className="mt-6 text-3xl sm:text-4xl font-semibold tracking-tight">
          Wunder<span className="text-primary">.rip</span> for iOS
        </h1>
        <p className="mt-3 text-base sm:text-lg text-text-secondary dark:text-text-dark-secondary max-w-xl mx-auto">
          The killed Wunderlist, back as a fast, native task manager for iPhone — synced with the
          web app you already use.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <span className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-md text-sm font-medium border border-border dark:border-border-dark text-text-secondary dark:text-text-dark-secondary whitespace-nowrap">
            Coming soon on the App Store
          </span>
          <a
            href="https://wunderrip.vercel.app"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-md text-sm font-medium bg-primary text-white hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background dark:focus:ring-offset-background-dark transition-colors whitespace-nowrap"
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
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium bg-primary text-white hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-surface dark:focus:ring-offset-surface-dark transition-colors"
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
