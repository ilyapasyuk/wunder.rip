import * as React from 'react'
import * as ReactDOM from 'react-dom/client'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'

import { ROUTE } from 'service/routes'

import { StoreProvider } from 'Components/Context/store'
import { TodoList } from 'Components/TodoList'

import { Auth } from './Components/Auth'
import { Layout } from './Components/Layout'
import './index.css'

const container = document.getElementById('wunderTodo')

const router = createBrowserRouter([
  {
    path: ROUTE.ROOT,
    element: <TodoList />,
    children: [
      {
        path: ROUTE.TASK_PAGE,
        element: <TodoList />,
      },
    ],
  },
])

if (container) {
  ReactDOM.createRoot(container).render(
    <React.StrictMode>
      <StoreProvider>
        <Layout>
          <Auth>
            <RouterProvider router={router} />
          </Auth>
        </Layout>
      </StoreProvider>
    </React.StrictMode>,
  )
}
