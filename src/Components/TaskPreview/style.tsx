import styled from 'styled-components'

const StyledTaskPreview = styled.div`
    background: white;
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    min-width: 400px;
    max-width: 600px;
    z-index: 99999;
    padding: 16px;
    box-shadow: 0 0 4px rgb(50 50 50 / 8%);
    border-left: 1px solid #ededed;
`

const StyledTodoListTaskName = styled.div`
    margin-bottom: 16px;
    border-radius: 4px;
    overflow: hidden;

    input,
    textarea {
        padding: 8px;
        background-color: lightgray;
        border: 0;
        width: 100%;
    }
`

const StyledTodoListFiles = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: 1fr;
    gap: 8px 8px;
    grid-template-areas: '. .';
    margin-bottom: 16px;
`

const StyledTodoListFile = styled.div`
    position: relative;
    border: 1px solid lightgray;
    border-radius: 4px;
`

const StyledTodoListFileDelete = styled.button`
    position: absolute;
    right: 0;
    top: 0;
    z-index: 2;
    border: 0;
    margin: 0;
    padding: 0;
    background: transparent;
    cursor: pointer;
`

const StyledTodoListFilePreview = styled.div`
    position: absolute;
    right: 0;
    top: 0;
    bottom: 0;
    left: 0;
    opacity: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1;
    cursor: pointer;
    transition: all 150ms ease;

    &:hover {
        opacity: 1;
    }
`

export {
    StyledTaskPreview,
    StyledTodoListFiles,
    StyledTodoListFile,
    StyledTodoListFileDelete,
    StyledTodoListFilePreview,
    StyledTodoListTaskName,
}
