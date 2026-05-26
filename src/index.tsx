import { StoreProvider } from 'Components/Context/store'
import { Workspace } from 'Components/Workspace'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, Outlet, RouterProvider } from 'react-router-dom'
import { ROUTE } from 'services/routes'
import { applyTheme, getInitialTheme, watchSystemTheme } from 'services/theme'

import { Account } from './Components/Account'
import { Auth } from './Components/Auth'
import { Layout } from './Components/Layout'
import { Privacy } from './Components/Legal/Privacy'
import { Terms } from './Components/Legal/Terms'
import { NotFound } from './Components/NotFound'
import { TaskPreview } from './Components/TaskPreview'
import './index.css'

const container = document.getElementById('wunderTodo')

// Инициализация темы перед рендером
applyTheme(getInitialTheme())

// Слушатель системной темы (только если пользователь не выбрал тему вручную)
if (typeof window !== 'undefined') {
  watchSystemTheme(() => {
    // Обновление происходит автоматически через watchSystemTheme
  })
}

const router = createBrowserRouter([
  {
    element: (
      <Layout>
        <Outlet />
      </Layout>
    ),
    children: [
      {
        path: ROUTE.TERMS,
        element: <Terms />,
      },
      {
        path: ROUTE.PRIVACY,
        element: <Privacy />,
      },
      {
        element: (
          <Auth>
            <Outlet />
          </Auth>
        ),
        children: [
          {
            path: ROUTE.ACCOUNT,
            element: <Account />,
          },
          {
            path: ROUTE.ROOT,
            element: <Workspace />,
            children: [
              {
                path: 't/:id',
                element: <TaskPreview onClose={() => {}} />,
              },
            ],
          },
        ],
      },
      {
        path: '*',
        element: <NotFound />,
      },
    ],
  },
])

if (container) {
  ReactDOM.createRoot(container).render(
    <React.StrictMode>
      <StoreProvider>
        <RouterProvider router={router} />
      </StoreProvider>
    </React.StrictMode>,
  )
}
