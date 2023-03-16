import React from 'react'

import { PROVIDER } from '../Layout'

interface Props {
    onLogin: (provider: PROVIDER) => void
}

const LoginForm = ({ onLogin }: Props) => {
    return (
        <div className="w-full h-full p-8">
            <button
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-rose-600 hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500"
                onClick={() => onLogin(PROVIDER.GOOGLE)}
            >
                Google
            </button>
        </div>
    )
}

export { LoginForm }
