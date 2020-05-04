import React from "react"
import {StyledAddTask} from "./style"

const AddTask = ({activeField, onChange, keyHandle}) => {
    return (
        <StyledAddTask
            type="text"
            value={activeField}
            onChange={e => onChange(e.target.value)}
            onKeyPress={keyHandle}
        />
    )
}

export default AddTask
