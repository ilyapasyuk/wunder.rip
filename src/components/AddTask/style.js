import styled from 'styled-components'

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

export {StyledAddTask}
