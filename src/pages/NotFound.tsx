import { ArrowLeftIcon, HomeIcon } from '@heroicons/react/20/solid'
import { Link, useNavigate } from 'react-router-dom'

const NotFound = () => {
  const navigate = useNavigate()

  return (
    <main className="min-h-full flex items-center justify-center px-4 py-16">
      <div className="text-center max-w-md">
        <div className="text-7xl sm:text-8xl font-bold tracking-tight text-primary leading-none">
          404
        </div>
        <h1 className="mt-4 text-2xl sm:text-3xl font-semibold tracking-tight text-text-primary dark:text-text-dark-primary">
          Page not found
        </h1>
        <p className="mt-2 text-sm text-text-secondary dark:text-text-dark-secondary">
          The page you&apos;re looking for doesn&apos;t exist, was moved, or never existed in the
          first place.
        </p>

        <div className="mt-8 flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium border border-border dark:border-border-dark text-text-primary dark:text-text-dark-primary hover:bg-overlay-hover focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
          >
            <ArrowLeftIcon className="size-4 shrink-0" aria-hidden="true" />
            Go back
          </button>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium bg-primary text-white hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background dark:focus:ring-offset-background-dark transition-colors"
          >
            <HomeIcon className="size-4 shrink-0" aria-hidden="true" />
            Back to home
          </Link>
        </div>
      </div>
    </main>
  )
}

export { NotFound }
