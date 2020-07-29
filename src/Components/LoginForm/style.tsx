import styled from 'styled-components'

const StyledLoginForm = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
`

const StyledButton = styled.button`
    display: block;
    padding: 10px;
    border: 1px solid #ddd;
    box-shadow: 0 1px 2px rgba(120, 120, 120, 0.05);
    border-radius: 3px;
    text-decoration: none;
    color: #fff;
    text-align: center;
    font-weight: bold;
    background-color: #dd4b39;
`

export { StyledLoginForm, StyledButton }
