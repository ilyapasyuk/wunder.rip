import styled from 'styled-components'

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

const StyledCheckbox = styled.span`
    padding-left: 8px;
    padding-right: 8px;
    
    input {
      display: none;
    }
    
    &:before {
        content: '';
        border: 1px solid rgba(0,0,0,0.35);
        cursor: pointer;
        width: 16px;
        height: 16px;
        display: block;
        border-radius: 3px;
        background: ${({isCompleted}) => isCompleted && 'rgba(0,0,0,0.35)'};
    }
`

const StyledTaskName = styled.div`
  text-decoration: ${({isCompleted}) => isCompleted && 'line-through'};
  pointer-events: none;
`

export {StyledTodo, StyledCheckbox, StyledTaskName}
