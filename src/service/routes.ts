const getCreateTaskRoute = (userId: string): string =>
  `${import.meta.env.VITE_APP_DB_TASK_NAME}/${userId}`

const getUpdateTaskRoute = (userId: string, taskId: string): string =>
  `${import.meta.env.VITE_APP_DB_TASK_NAME}/${userId}/${taskId}`

const getUserRoute = (userId: string): string =>
  `${import.meta.env.VITE_APP_DB_TASK_NAME}/${userId}`

enum ROUTE {
  ROOT = '/',
  TASK_PAGE = '/t/:id',
}

export { getCreateTaskRoute, getUpdateTaskRoute, getUserRoute, ROUTE }
