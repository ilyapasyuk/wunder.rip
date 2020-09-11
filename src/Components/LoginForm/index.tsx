import React from 'react'

import { StyledLoginForm, StyledButton } from './style'

interface Props {
    onLogin: () => void
}

const LoginForm = ({ onLogin }: Props) => {
    return (
        <StyledLoginForm>
            <StyledButton onClick={onLogin}>Google</StyledButton>
        </StyledLoginForm>
    )
}

export { LoginForm }
