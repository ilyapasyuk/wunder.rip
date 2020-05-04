import React from 'react'
import {StyledTodo} from "./style";

const Todo = ({ isCompleted, text, id, onCompletedChange }) => {
    return (
        <StyledTodo >
            <input
                type="checkbox"
                value={isCompleted}
                onChange={e => onCompletedChange({ value: e.target.checked, id })}
            />
            {text}
        </StyledTodo>
    );
};

export default Todo
