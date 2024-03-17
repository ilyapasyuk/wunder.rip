import React from 'react'
import * as ReactDOMClient from 'react-dom/client'

import { Layout } from 'Components/Layout'

import './index.css'

const container = document.getElementById('wunderTodo')

let root = null

if (container) {
  root = ReactDOMClient.createRoot(container)
  root.render(<Layout />)
}
