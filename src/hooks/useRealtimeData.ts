import { onValue, ref } from 'firebase/database'
import { Dispatch, SetStateAction, useEffect, useState } from 'react'
import { getFoldersRoute, getUserRoute } from 'services/db-paths'
import { db } from 'services/firebase'
import { Folder } from 'services/folder'
import { Todo } from 'services/task'

export type LoadStatus = 'loading' | 'ready' | 'error'

/**
 * Subscribes to one Realtime Database path. Until the first snapshot arrives the status is
 * 'loading' — the UI must not read the empty initial value as "no data".
 */
const useRealtimeList = <T>(
  path: string | null,
  parse: (raw: Record<string, Record<string, unknown>>) => T[],
): [T[], LoadStatus, Dispatch<SetStateAction<T[]>>] => {
  const [items, setItems] = useState<T[]>([])
  const [status, setStatus] = useState<LoadStatus>('loading')

  // biome-ignore lint/correctness/useExhaustiveDependencies: `parse` is a module-level function per caller.
  useEffect(() => {
    setItems([])
    setStatus('loading')
    if (!path) return
    return onValue(
      ref(db, path),
      snapshot => {
        setItems(parse(snapshot.val() || {}))
        setStatus('ready')
      },
      error => {
        console.error(`Failed to load ${path}:`, error)
        setStatus('error')
      },
    )
  }, [path])

  return [items, status, setItems]
}

const parseTodos = (items: Record<string, Record<string, unknown>>): Todo[] =>
  Object.keys(items)
    .map(id => {
      const item = items[id] as Partial<Todo>
      return {
        id,
        createdAt: item.createdAt ?? 0,
        task: item.task ?? '',
        done: Boolean(item.done),
        note: item.note ?? '',
        files: item.files,
        order: item.order || 0,
        isPublic: item.isPublic || false,
        folderId: item.folderId ?? null,
      }
    })
    .sort((a, b) => (a.order || 0) - (b.order || 0))

const parseFolders = (items: Record<string, Record<string, unknown>>): Folder[] =>
  Object.keys(items)
    .map(id => {
      const item = items[id] as Partial<Folder>
      return { id, name: item.name ?? '', createdAt: item.createdAt ?? 0, order: item.order || 0 }
    })
    .sort((a, b) => (a.order || 0) - (b.order || 0))

const useTodos = (userId: string | undefined) =>
  useRealtimeList(userId ? getUserRoute(userId) : null, parseTodos)

const useFolders = (userId: string | undefined) =>
  useRealtimeList(userId ? getFoldersRoute(userId) : null, parseFolders)

export { useFolders, useTodos }
