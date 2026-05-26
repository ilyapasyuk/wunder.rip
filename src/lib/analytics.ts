import { logEvent } from 'firebase/analytics'
import { analytics } from 'services/firebase'

const trackLogin = (method: string) => logEvent(analytics, 'login', { method })

const trackTaskCreated = () => logEvent(analytics, 'task_created')

const trackTaskCompleted = (done: boolean) =>
  logEvent(analytics, done ? 'task_completed' : 'task_uncompleted')

const trackTaskDeleted = () => logEvent(analytics, 'task_deleted')

const trackTaskViewed = () => logEvent(analytics, 'task_viewed')

const trackTaskReordered = () => logEvent(analytics, 'task_reordered')

const trackFolderCreated = () => logEvent(analytics, 'folder_created')

const trackFolderRenamed = () => logEvent(analytics, 'folder_renamed')

const trackFolderDeleted = () => logEvent(analytics, 'folder_deleted')

export {
  trackFolderCreated,
  trackFolderDeleted,
  trackFolderRenamed,
  trackLogin,
  trackTaskCompleted,
  trackTaskCreated,
  trackTaskDeleted,
  trackTaskReordered,
  trackTaskViewed,
}
