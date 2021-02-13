import styled from 'styled-components'

const StyledTaskPreview = styled.div`
    background: white;
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    min-width: 300px;
    max-width: 600px;
    z-index: 99999;
    padding: 16px;
    box-shadow: 0 0 4px rgb(50 50 50 / 8%);
    border-left: 1px solid #ededed;
`

const StyledTodoListFiles = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: 1fr;
    gap: 8px 8px;
    grid-template-areas: '. .';
    margin-bottom: 16px;
`

export { StyledTaskPreview, StyledTodoListFiles }
