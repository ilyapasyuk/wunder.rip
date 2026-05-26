import { Link } from 'react-router-dom'
import { PROVIDER } from 'services/auth'

import { GoogleIcon } from './GoogleIcon'

interface Props {
  onLogin: (provider: PROVIDER) => void
}

const LoginForm = ({ onLogin }: Props) => {
  return (
    <div className="min-h-full flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-background dark:bg-background-dark">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center mb-8">
          <span
            aria-hidden="true"
            className="inline-flex size-12 rounded-2xl bg-gradient-to-br from-primary to-primary-hover items-center justify-center text-white font-bold text-xl shadow-sm mb-6"
          >
            W
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-text-primary dark:text-text-dark-primary leading-tight">
            Capture tasks.{' '}
            <span className="text-primary">Stay focused.</span>
          </h2>
          <p className="mt-3 text-sm text-text-secondary dark:text-text-dark-secondary">
            Your lists, notes, and images — all in one place.
          </p>
        </div>

        <div className="bg-surface dark:bg-surface-dark py-8 px-6 shadow-lg rounded-xl border border-border dark:border-border-dark sm:px-10">
          <button
            type="button"
            onClick={() => onLogin(PROVIDER.GOOGLE)}
            className="w-full inline-flex items-center justify-center gap-3 px-4 py-3 border border-border dark:border-border-dark rounded-lg shadow-sm bg-surface dark:bg-surface-dark text-sm font-medium text-text-primary dark:text-text-dark-primary hover:bg-overlay-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-200"
          >
            <GoogleIcon className="size-5 shrink-0" />
            <span>Continue with Google</span>
          </button>
        </div>

        <p className="mt-6 text-center text-xs text-text-secondary dark:text-text-dark-secondary">
          By continuing, you agree to our{' '}
          <Link to="/terms" className="text-primary hover:underline">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link to="/privacy" className="text-primary hover:underline">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  )
}

export { LoginForm }
