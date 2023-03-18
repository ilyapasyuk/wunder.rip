const getCreateTaskRoute = (userId: string): string =>
  `${process.env.REACT_APP_DB_TASK_NAME}/${userId}`

const getUpdateTaskRoute = (userId: string, taskId: string): string =>
  `${process.env.REACT_APP_DB_TASK_NAME}/${userId}/${taskId}`

const getUserRoute = (userId: string): string => `${process.env.REACT_APP_DB_TASK_NAME}/${userId}`

export { getCreateTaskRoute, getUpdateTaskRoute, getUserRoute }
