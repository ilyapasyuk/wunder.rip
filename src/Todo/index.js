import React from 'react'
import {StyledTodo, StyledCheckbox, StyledTaskName} from "./style";

const Todo = ({isCompleted, text, id, onCompletedChange}) => {
    return (
        <StyledTodo onClick={() => onCompletedChange({value: !isCompleted, id})}>
            <StyledCheckbox isCompleted={isCompleted}>
                <input type="checkbox" value={isCompleted} />
            </StyledCheckbox>
            <StyledTaskName isCompleted={isCompleted}>{text}</StyledTaskName>
        </StyledTodo>
    );
};

export default Todo
