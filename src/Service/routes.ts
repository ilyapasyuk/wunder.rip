const getCreateTaskRoute = (userId: string): string => `todos/${userId}`

const getUpdateTaskRoute = (userId: string, taskId: string): string => `todos/${userId}/${taskId}`

const getUserRoute = (userId: string) => `todos/${userId}`

export { getCreateTaskRoute, getUpdateTaskRoute, getUserRoute }
