import React from 'react'

import { PROVIDER } from 'service/auth'

interface Props {
  onLogin: (provider: PROVIDER) => void
}

const providers = [
  { provider: PROVIDER.GOOGLE, name: 'Google' },
  { provider: PROVIDER.FACEBOOK, name: 'Facebook' },
]

const LoginForm = ({ onLogin }: Props) => {
  return (
    <div className="w-full h-full p-8 bg-background dark:bg-background-dark">
      <>
        <div className="min-h-full flex flex-col justify-center py-12 sm:px-6 lg:px-8">
          <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
            <div className="bg-surface dark:bg-surface-dark py-8 px-4 shadow-lg rounded-lg border border-border dark:border-border-dark sm:px-10">
              <button
                className="w-full inline-flex justify-center py-3 px-4 border border-border dark:border-border-dark rounded-lg shadow-sm bg-surface dark:bg-surface-dark text-base font-medium text-text-primary dark:text-text-dark-primary hover:bg-overlay-hover transition-colors"
                onClick={() => {
                  onLogin(PROVIDER.GOOGLE)
                }}
              >
                <span>Sign in with Google</span>
              </button>
            </div>
          </div>
        </div>
      </>

      {providers.map(({ name, provider }) => (
        <button
          key={provider}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
          onClick={() => onLogin(provider)}
        >
          {name}
        </button>
      ))}
    </div>
  )
}

export { LoginForm }
