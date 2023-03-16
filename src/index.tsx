import React from 'react'
import ReactDOM from 'react-dom'
import './index.css'

import { Layout } from 'Components/Layout'
import * as serviceWorker from './serviceWorker'

ReactDOM.render(<Layout />, document.getElementById('wunderTodo'))

serviceWorker.unregister()
