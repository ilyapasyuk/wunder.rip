import { Layout } from 'components/layout/Layout'
import { applyTheme, getInitialTheme, watchSystemTheme } from 'lib/theme'
import { Account } from 'pages/Account/Account'
import { Auth } from 'pages/Auth'
import { Ios } from 'pages/Ios/Ios'
import { Privacy } from 'pages/Legal/Privacy'
import { Terms } from 'pages/Legal/Terms'
import { NotFound } from 'pages/NotFound'
import { Support } from 'pages/Support/Support'
import { TaskPreview } from 'pages/TaskPreview/TaskPreview'
import { Workspace } from 'pages/Workspace/Workspace'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, Outlet, RouterProvider } from 'react-router-dom'
import { ROUTE } from 'routes'
import { StoreProvider } from 'store/store'
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
        path: ROUTE.IOS,
        element: <Ios />,
      },
      {
        path: ROUTE.SUPPORT,
        element: <Support />,
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
