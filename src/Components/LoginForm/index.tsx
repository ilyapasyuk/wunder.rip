import { PROVIDER } from 'services/auth'

import { GoogleIcon } from './GoogleIcon'

interface Props {
  onLogin: (provider: PROVIDER) => void
}

const LoginForm = ({ onLogin }: Props) => {
  return (
    <div className="min-h-screen flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-background dark:bg-background-dark">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold tracking-tight text-text-primary dark:text-text-dark-primary">
            Welcome to Wunder Rip
          </h2>
          <p className="mt-2 text-sm text-text-secondary dark:text-text-dark-secondary">
            Sign in to continue to your account
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

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border dark:border-border-dark" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-surface dark:bg-surface-dark text-text-secondary dark:text-text-dark-secondary">
                  Secure authentication
                </span>
              </div>
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-text-secondary dark:text-text-dark-secondary">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  )
}

export { LoginForm }
