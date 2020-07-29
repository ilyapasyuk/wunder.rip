import React from 'react'
import ReactDOM from 'react-dom'
import { ThemeProvider } from 'styled-components'

import { Layout } from 'Components/Layout'
import { LIGHT_THEME } from 'Components/Layout/theme'
import * as serviceWorker from './serviceWorker'

ReactDOM.render(
    <React.StrictMode>
        <ThemeProvider theme={LIGHT_THEME}>
            <Layout />
        </ThemeProvider>
    </React.StrictMode>,
    document.getElementById('wunderTodo'),
)

serviceWorker.unregister()
