import { trackFolderCreated, trackFolderDeleted, trackFolderRenamed } from 'services/analytics'
import { databaseRef } from 'services/firebase'
import {
  getFoldersRoute,
  getUpdateFolderRoute,
  getUpdateTaskRoute,
  getUserRoute,
} from 'services/routes'
import { toast } from 'sonner'

export type IFolder = {
  id?: string
  name: string
  createdAt: number
  order?: number
}

const createFolder = async (
  name: string,
  userId: string,
): Promise<{
  id?: string | null
  error?: Error
}> => {
  try {
    const timestamp = Date.now()
    const value: IFolder = {
      name: name.slice(0, 60).trim(),
      createdAt: timestamp,
      order: -timestamp,
    }
    const folderRef = await databaseRef.child(getFoldersRoute(userId)).push(value)
    toast.success('List created')
    trackFolderCreated()
    return { id: folderRef.key }
  } catch (error) {
    const message = `Error creating list: ${error}`
    console.error(message)
    toast.error(message)
    return { error: new Error(message) }
  }
}

const renameFolder = async (folderId: string, name: string, userId: string) => {
  try {
    const trimmed = name.slice(0, 60).trim()
    if (!trimmed) {
      return
    }
    await databaseRef.update({
      [`${getUpdateFolderRoute(userId, folderId)}/name`]: trimmed,
    })
    trackFolderRenamed()
  } catch (error) {
    const message = `Error renaming list: ${error}`
    console.error(message)
    toast.error(message)
  }
}

const deleteFolder = async (folderId: string, userId: string) => {
  try {
    const snapshot = await databaseRef.child(getUserRoute(userId)).once('value')
    const tasks = (snapshot.val() || {}) as Record<string, { folderId?: string | null }>

    const updates: Record<string, unknown> = {
      [getUpdateFolderRoute(userId, folderId)]: null,
    }

    for (const taskId of Object.keys(tasks)) {
      if (tasks[taskId]?.folderId === folderId) {
        updates[`${getUpdateTaskRoute(userId, taskId)}/folderId`] = null
      }
    }

    await databaseRef.update(updates)
    toast.success('List deleted')
    trackFolderDeleted()
  } catch (error) {
    const message = `Error deleting list: ${error}`
    console.error(message)
    toast.error(message)
  }
}

export { createFolder, deleteFolder, renameFolder }
