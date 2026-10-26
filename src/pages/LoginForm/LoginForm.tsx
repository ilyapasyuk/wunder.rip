import { Link } from 'react-router-dom'
import { PROVIDER } from 'services/auth'

import { GoogleIcon } from './GoogleIcon'

interface Props {
  onLogin: (provider: PROVIDER) => void
}

const LoginForm = ({ onLogin }: Props) => {
  return (
    <div className="min-h-dvh flex flex-col justify-center px-5 py-12 bg-background">
      <div className="mx-auto w-full max-w-md">
        <h1 className="font-display text-5xl sm:text-6xl font-bold tracking-[-0.03em] leading-none">
          <span className="text-text-primary">Wunder</span>
          <span className="text-accent">.rip</span>
        </h1>
        <p className="mt-5 text-xl font-medium leading-snug text-text-secondary">
          Tasks, notes and images in one place. Synced to your phone.
        </p>

        <div className="mt-10 rounded-3xl bg-muted shadow-card p-3">
          <button
            type="button"
            onClick={() => onLogin(PROVIDER.GOOGLE)}
            className="w-full h-16 inline-flex items-center justify-center gap-3 rounded-2xl bg-surface shadow-tile ring-1 ring-border text-[17px] font-semibold text-text-primary transition-transform hover:scale-[1.01] active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
          >
            <GoogleIcon className="size-5 shrink-0" />
            <span>Continue with Google</span>
          </button>
        </div>

        <p className="mt-6 px-1 text-sm leading-relaxed text-text-secondary">
          By continuing, you agree to our{' '}
          <Link to="/terms" className="text-text-primary underline underline-offset-2">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link to="/privacy" className="text-text-primary underline underline-offset-2">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  )
}

export { LoginForm }
