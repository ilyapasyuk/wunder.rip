import React from 'react'

import { StyledButton, StyledLoginForm } from './style'
import { PROVIDER } from '../Layout'

interface Props {
    onLogin: (provider: PROVIDER) => void
}

const LoginForm = ({ onLogin }: Props) => {
    return (
        <StyledLoginForm>
            <StyledButton onClick={() => onLogin(PROVIDER.GOOGLE)}>Google</StyledButton>
        </StyledLoginForm>
    )
}

export { LoginForm }
