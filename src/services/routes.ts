const TASK_DB = (import.meta.env.VITE_APP_DB_TASK_NAME as string | undefined) || 'todos_dev'

const FOLDER_DB = (import.meta.env.VITE_APP_DB_FOLDER_NAME as string | undefined) || 'folders_dev'

const getCreateTaskRoute = (userId: string): string => `${TASK_DB}/${userId}`

const getUpdateTaskRoute = (userId: string, taskId: string): string =>
  `${TASK_DB}/${userId}/${taskId}`

const getUserRoute = (userId: string): string => `${TASK_DB}/${userId}`

const getFoldersRoute = (userId: string): string => `${FOLDER_DB}/${userId}`

const getUpdateFolderRoute = (userId: string, folderId: string): string =>
  `${FOLDER_DB}/${userId}/${folderId}`

enum ROUTE {
  ROOT = '/',
  TASK_PAGE = '/t/:id',
}

export {
  getCreateTaskRoute,
  getUpdateTaskRoute,
  getUserRoute,
  getFoldersRoute,
  getUpdateFolderRoute,
  ROUTE,
}
