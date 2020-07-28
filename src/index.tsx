import React from 'react'
import ReactDOM from 'react-dom'
import { Layout } from 'Components/Layout'
import * as serviceWorker from './serviceWorker'

ReactDOM.render(
    <React.StrictMode>
        <Layout />
    </React.StrictMode>,
    document.getElementById('root'),
)

serviceWorker.unregister()
