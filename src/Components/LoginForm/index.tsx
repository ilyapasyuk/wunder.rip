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
