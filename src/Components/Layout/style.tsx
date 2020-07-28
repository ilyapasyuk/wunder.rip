import styled, { createGlobalStyle } from 'styled-components'

const GlobalStyle = createGlobalStyle`
    body {
      background-color: #23241f;
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
        'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
        sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    
    code {
      font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New', monospace;
    }
`

const StyledLayout = styled.div``

const StyledAddTask = styled.input`
    background: rgba(158, 54, 40, 0.55);
    overflow: hidden;
    position: relative;
    margin: 14px 0;
    border-radius: 3px;
    border: 0;
    display: block;
    width: 100%;
    height: 47px;
    color: #fff;
    font-size: 16px;
    padding: 13px 60px 14px 13px;
    outline: none;

    &::placeholder {
        color: #fff;
    }
`

const StyledTodo = styled.div`
    background: #fff;
    list-style: none;
    height: 46px;
    border-radius: 3px;
    display: flex;
    padding-left: 4px;
    padding-right: 4px;
    align-items: center;
    position: relative;
    margin-bottom: 1px;
`

interface StyledCheckboxProps {
    isCompleted: boolean
}

const StyledCheckbox = styled.span`
    padding-left: 8px;
    padding-right: 8px;

    input {
        display: none;
    }

    &:before {
        content: '';
        border: 1px solid rgba(0, 0, 0, 0.35);
        cursor: pointer;
        width: 16px;
        height: 16px;
        display: block;
        border-radius: 3px;
        background: ${({ isCompleted }: StyledCheckboxProps) => isCompleted && 'rgba(0,0,0,0.35)'};
    }
`

const StyledTaskName = styled.div`
    color: #23241f;
    text-decoration: ${({ isCompleted }: StyledCheckboxProps) => isCompleted && 'line-through'};
    pointer-events: none;
`

export { GlobalStyle, StyledLayout, StyledAddTask, StyledTodo, StyledCheckbox, StyledTaskName }
