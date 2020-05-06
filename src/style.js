import styled, { createGlobalStyle } from 'styled-components'

const GlobalStyles = createGlobalStyle`
  body,
  html,
  #root {
    margin: 0;
    padding: 0;
    height: 100%;
    font-family: "Lato","Geneva CY","Lucida Grande","Arial Unicode MS","Helvetica Neue","Helvetica","Arial",sans-serif;
  }
  
  *, &:after, &:before {
    box-sizing: border-box;
    -webkit-font-smoothing: antialiased;
}
`

const StyledApp = styled.div`
    background: #bc4a3a;
    height: 100%;
`
export { GlobalStyles, StyledApp }
