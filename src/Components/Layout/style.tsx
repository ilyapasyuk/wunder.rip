import styled, { createGlobalStyle } from 'styled-components'

const GlobalStyle = createGlobalStyle`
   *,
    *:before,
    *:after {
        box-sizing: border-box;
        -webkit-font-smoothing: antialiased;
        font-family: 'Roboto', sans-serif;
    }
    
    html, body, #wunderTodo {
        height: 100%;
    }
    
    body {
      background-color: white;
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

const StyledLayout = styled.div`
    padding: 16px;
    background-color: ${props => props.theme.backGroundApp};
    height: 100%;
`

const StyledAddTask = styled.input`
    background-color: #fff;
    border: 1px solid #ddd;
    -webkit-box-shadow: 0 1px 3px rgba(50, 50, 50, 0.08);
    box-shadow: 0 1px 3px rgba(50, 50, 50, 0.08);
    border-radius: 4px;
    font-size: 16px;
    overflow: hidden;
    position: relative;
    margin: 14px 0;
    display: block;
    width: 100%;
    height: 47px;
    color: black;
    padding: 13px 60px 14px 13px;
    outline: none;

    &::placeholder {
        color: grey;
    }
`

const StyledTodo = styled.div`
    background: #fff;
    list-style: none;
    height: 46px;
    display: flex;
    padding-left: 4px;
    padding-right: 4px;
    align-items: center;
    position: relative;
    z-index: 9999;
    overflow: hidden;
    border: 1px solid #ededed;
    user-select: none;
    -webkit-text-size-adjust: 100%;
    margin-bottom: 8px;
    box-shadow: 0 1px 3px rgba(50, 50, 50, 0.08);
    border-radius: 4px;
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

const StyledDeleteButton = styled.button`
    border: 0;
    outline: none;
    padding: 0;
    background: transparent;
    position: absolute;
    right: 10px;
    cursor: pointer;

    &:hover {
        svg {
            fill: #1b7edf;
        }
    }

    svg {
        width: 20px;
        fill: grey;
    }
`

export {
    GlobalStyle,
    StyledLayout,
    StyledAddTask,
    StyledTodo,
    StyledCheckbox,
    StyledTaskName,
    StyledDeleteButton,
}
