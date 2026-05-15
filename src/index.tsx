import { StoreProvider } from 'Components/Context/store'
import { Workspace } from 'Components/Workspace'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { ROUTE } from 'services/routes'
import { applyTheme, getInitialTheme, watchSystemTheme } from 'services/theme'

import { Auth } from './Components/Auth'
import { Layout } from './Components/Layout'
import TaskPreview from './Components/TaskPreview'
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
    path: ROUTE.ROOT,
    element: <Workspace />,
    children: [
      {
        path: 't/:id',
        element: <TaskPreview onClose={() => {}} />,
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
