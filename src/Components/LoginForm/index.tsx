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
    <div className="w-full h-full p-8 bg-[#f6f7fb]">
      <>
        <div className="min-h-full flex flex-col justify-center py-12 sm:px-6 lg:px-8">
          <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
            <div className="bg-white py-8 px-4 shadow-lg rounded-lg border border-[#c3c6d4] sm:px-10">
              <button
                className="w-full inline-flex justify-center py-3 px-4 border border-[#c3c6d4] rounded-lg shadow-sm bg-white text-base font-medium text-[#323338] hover:bg-[rgba(103,104,121,0.1)] transition-colors"
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
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-[#0073ea] hover:bg-[#0060b9] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0073ea] transition-colors"
          onClick={() => onLogin(provider)}
        >
          {name}
        </button>
      ))}
    </div>
  )
}

export { LoginForm }
