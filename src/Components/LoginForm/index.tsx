import React from 'react'

import { StyledButton, StyledLoginForm } from './style'

interface Props {
    onGithubLogin: () => void
    onGoogleLogin: () => void
}

const LoginForm = ({ onGoogleLogin, onGithubLogin }: Props) => {
    return (
        <StyledLoginForm>
            <StyledButton onClick={() => onGoogleLogin()}>Google</StyledButton>
            <StyledButton onClick={() => onGithubLogin()}>Github</StyledButton>
        </StyledLoginForm>
    )
}

export { LoginForm }
