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
    <div className="w-full h-full p-8">
      <>
        <div className="min-h-full flex flex-col justify-center py-12 sm:px-6 lg:px-8">
          <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
            <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
              <button
                className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
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
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-rose-600 hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500"
          onClick={() => onLogin(provider)}
        >
          {name}
        </button>
      ))}
    </div>
  )
}

export { LoginForm }
