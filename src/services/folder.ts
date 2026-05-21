import { get, push, ref, update } from 'firebase/database'

import { trackFolderCreated, trackFolderDeleted, trackFolderRenamed } from 'services/analytics'
import { db } from 'services/firebase'
import { notify } from 'services/notify'
import {
  getFoldersRoute,
  getUpdateFolderRoute,
  getUpdateTaskRoute,
  getUserRoute,
} from 'services/routes'

export type Folder = {
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
    const value: Folder = {
      name: name.slice(0, 60).trim(),
      createdAt: timestamp,
      order: -timestamp,
    }
    const folderRef = await push(ref(db, getFoldersRoute(userId)), value)
    notify.success('List created')
    trackFolderCreated()
    return { id: folderRef.key }
  } catch (error) {
    const message = `Error creating list: ${error}`
    console.error(message)
    notify.error(message)
    return { error: new Error(message) }
  }
}

const renameFolder = async (folderId: string, name: string, userId: string) => {
  try {
    const trimmed = name.slice(0, 60).trim()
    if (!trimmed) {
      return
    }
    await update(ref(db), {
      [`${getUpdateFolderRoute(userId, folderId)}/name`]: trimmed,
    })
    notify.success('List renamed')
    trackFolderRenamed()
  } catch (error) {
    const message = `Error renaming list: ${error}`
    console.error(message)
    notify.error(message)
  }
}

const deleteFolder = async (folderId: string, userId: string) => {
  try {
    const snapshot = await get(ref(db, getUserRoute(userId)))
    const tasks = (snapshot.val() || {}) as Record<string, { folderId?: string | null }>

    const updates: Record<string, unknown> = {
      [getUpdateFolderRoute(userId, folderId)]: null,
    }

    for (const taskId of Object.keys(tasks)) {
      if (tasks[taskId]?.folderId === folderId) {
        updates[`${getUpdateTaskRoute(userId, taskId)}/folderId`] = null
      }
    }

    await update(ref(db), updates)
    notify.success('List deleted')
    trackFolderDeleted()
  } catch (error) {
    const message = `Error deleting list: ${error}`
    console.error(message)
    notify.error(message)
  }
}

export { createFolder, deleteFolder, renameFolder }
