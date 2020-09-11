import styled from 'styled-components'

const StyledTodo = styled.div`
    background: #fff;
    list-style: none;
    height: 46px;
    display: flex;
    padding-left: 4px;
    padding-right: 4px;
    align-items: center;
    position: relative;
    z-index: 9;
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
    color: ${props => props.theme.taskName};
    text-decoration: ${({ isCompleted }: StyledCheckboxProps) => isCompleted && 'line-through'};
    pointer-events: none;
    position: absolute;
    left: 0;
    top: 0;
    right: 0;
    bottom: 0;
    padding: 8px 42px 8px 42px;
    font-size: 14px;
    display: flex;
    align-items: center;

    span {
        text-overflow: ellipsis;
    }
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

export { StyledTodo, StyledCheckbox, StyledTaskName, StyledDeleteButton }
