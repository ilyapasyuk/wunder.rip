import { ACTION_TYPE } from 'Components/Context/actions'
import { StoreContext } from 'Components/Context/store'
import { FOLDER_DROPPABLE_PREFIX, INBOX_DROPPABLE_ID } from 'Components/Workspace/droppable'
import { useDroppable } from '@dnd-kit/core'
import {
  CheckIcon,
  InboxIcon,
  PencilSquareIcon,
  PlusIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/react/20/solid'
import type { DataSnapshot } from 'firebase/database'
import { KeyboardEvent, ReactNode, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { databaseRef } from 'services/firebase'
import { createFolder, deleteFolder, IFolder, renameFolder } from 'services/folder'
import { getFoldersRoute } from 'services/routes'
import { ITodo } from 'services/task'

interface ISidebarProps {
  todos: ITodo[]
}

interface IDroppableRowProps {
  id: string
  isActive: boolean
  isCurrentFolder: boolean
  children: ReactNode
}

const DroppableRow = ({ id, isActive, isCurrentFolder, children }: IDroppableRowProps) => {
  const { isOver, setNodeRef } = useDroppable({ id })
  const itemBase =
    'w-full flex items-center justify-between gap-2 rounded-md px-3 py-2 text-sm transition-colors group'
  const itemIdle = 'text-text-primary dark:text-text-dark-primary hover:bg-overlay-hover'
  const itemActive =
    'bg-primary-light dark:bg-primary/20 text-text-primary dark:text-text-dark-primary'
  const dropTarget = 'ring-2 ring-inset ring-primary bg-primary-light/60 dark:bg-primary/30'
  const showDropTarget = isOver && !isCurrentFolder
  return (
    <div
      ref={setNodeRef}
      className={`${itemBase} ${isActive ? itemActive : itemIdle} ${
        showDropTarget ? dropTarget : ''
      }`}
    >
      {children}
    </div>
  )
}

const Sidebar = ({ todos }: ISidebarProps) => {
  const { state, dispatch } = useContext(StoreContext)
  const [folders, setFolders] = useState<IFolder[]>([])
  const [foldersLoaded, setFoldersLoaded] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const editInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!state?.user?.id) {
      setFolders([])
      setFoldersLoaded(false)
      return
    }
    const unsubscribe = databaseRef
      .child(getFoldersRoute(state.user.id))
      .on('value', (snapshot: DataSnapshot) => {
        const items = snapshot.val() || {}
        const prepared: IFolder[] = Object.keys(items)
          .map(id => ({
            id,
            name: items[id].name,
            createdAt: items[id].createdAt,
            order: items[id].order || 0,
          }))
          .sort((a, b) => (a.order || 0) - (b.order || 0))
        setFolders(prepared)
        setFoldersLoaded(true)
      })
    return () => unsubscribe()
  }, [state.user])

  useEffect(() => {
    if (!foldersLoaded || !state.currentFolderId) return
    if (!folders.some(f => f.id === state.currentFolderId)) {
      dispatch({ type: ACTION_TYPE.SET_CURRENT_FOLDER, payload: { folderId: null } })
    }
  }, [foldersLoaded, folders, state.currentFolderId, dispatch])

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus()
      editInputRef.current.select()
    }
  }, [editingId])

  const counts = useMemo(() => {
    const map: Record<string, number> = { __inbox__: 0 }
    for (const t of todos) {
      if (t.done) continue
      const key = t.folderId || '__inbox__'
      map[key] = (map[key] || 0) + 1
    }
    return map
  }, [todos])

  const handleCreate = async () => {
    const value = newFolderName.trim()
    if (!value || !state?.user?.id) return
    setNewFolderName('')
    await createFolder(value, state.user.id)
  }

  const handleNewFolderKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleCreate()
    } else if (e.key === 'Escape') {
      setNewFolderName('')
    }
  }

  const startEdit = (folder: IFolder) => {
    if (!folder.id) return
    setEditingId(folder.id)
    setEditingName(folder.name)
  }

  const commitEdit = async () => {
    if (!editingId || !state?.user?.id) {
      setEditingId(null)
      return
    }
    const value = editingName.trim()
    if (value) {
      await renameFolder(editingId, value, state.user.id)
    }
    setEditingId(null)
  }

  const handleEditKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      commitEdit()
    } else if (e.key === 'Escape') {
      setEditingId(null)
    }
  }

  const handleDelete = async (folder: IFolder) => {
    if (!folder.id || !state?.user?.id) return
    const confirmed = window.confirm(`Delete list "${folder.name}"? Tasks will be moved to Inbox.`)
    if (!confirmed) return
    if (state.currentFolderId === folder.id) {
      dispatch({ type: ACTION_TYPE.SET_CURRENT_FOLDER, payload: { folderId: null } })
    }
    await deleteFolder(folder.id, state.user.id)
  }

  const setCurrent = (folderId: string | null) => {
    dispatch({ type: ACTION_TYPE.SET_CURRENT_FOLDER, payload: { folderId } })
  }

  return (
    <aside className="w-full md:w-64 md:shrink-0 md:border-r border-border dark:border-border-dark bg-surface dark:bg-surface-dark md:min-h-[calc(100vh-3.5rem)]">
      <div className="px-3 py-4 flex flex-col gap-1">
        <DroppableRow
          id={INBOX_DROPPABLE_ID}
          isActive={state.currentFolderId === null}
          isCurrentFolder={state.currentFolderId === null}
        >
          <button
            type="button"
            onClick={() => setCurrent(null)}
            className="flex flex-1 items-center gap-2 min-w-0 text-left"
          >
            <InboxIcon className="size-5 shrink-0 text-text-secondary dark:text-text-dark-secondary" />
            <span className="truncate">Inbox</span>
          </button>
          <div className="flex items-center justify-end shrink-0 min-w-[3.5rem]">
            {counts.__inbox__ > 0 && (
              <span className="text-xs text-text-secondary dark:text-text-dark-secondary">
                {counts.__inbox__}
              </span>
            )}
          </div>
        </DroppableRow>

        {folders.map(folder => {
          const isActive = state.currentFolderId === folder.id
          const isEditing = editingId === folder.id
          const count = folder.id ? counts[folder.id] || 0 : 0
          return (
            <DroppableRow
              key={folder.id}
              id={`${FOLDER_DROPPABLE_PREFIX}${folder.id}`}
              isActive={isActive}
              isCurrentFolder={isActive}
            >
              {isEditing ? (
                <>
                  <input
                    ref={editInputRef}
                    type="text"
                    value={editingName}
                    onChange={e => setEditingName(e.target.value)}
                    onKeyDown={handleEditKey}
                    onBlur={commitEdit}
                    className="flex-1 min-w-0 bg-transparent border-0 outline-none focus:ring-0 text-sm text-text-primary dark:text-text-dark-primary"
                    maxLength={60}
                  />
                  <button
                    type="button"
                    onMouseDown={e => e.preventDefault()}
                    onClick={commitEdit}
                    aria-label="Save"
                    className="p-1 rounded-md text-text-secondary dark:text-text-dark-secondary hover:text-text-primary dark:hover:text-text-dark-primary"
                  >
                    <CheckIcon className="size-4 shrink-0" />
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setCurrent(folder.id ?? null)}
                    className="flex flex-1 items-center gap-2 min-w-0 text-left"
                  >
                    <span className="truncate">{folder.name}</span>
                  </button>
                  <div className="flex items-center justify-end gap-1 shrink-0 min-w-[3.5rem]">
                    {count > 0 && (
                      <span className="text-xs text-text-secondary dark:text-text-dark-secondary group-hover:hidden">
                        {count}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => startEdit(folder)}
                      aria-label="Rename list"
                      className="hidden group-hover:inline-flex p-1 rounded-md text-text-secondary dark:text-text-dark-secondary hover:text-text-primary dark:hover:text-text-dark-primary"
                    >
                      <PencilSquareIcon className="size-4 shrink-0" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(folder)}
                      aria-label="Delete list"
                      className="hidden group-hover:inline-flex p-1 rounded-md text-text-secondary dark:text-text-dark-secondary hover:text-text-primary dark:hover:text-text-dark-primary"
                    >
                      <TrashIcon className="size-4 shrink-0" />
                    </button>
                  </div>
                </>
              )}
            </DroppableRow>
          )
        })}

        <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded-md ring-1 ring-inset ring-border dark:ring-border-dark">
          <PlusIcon className="size-4 shrink-0 text-text-secondary dark:text-text-dark-secondary" />
          <input
            type="text"
            value={newFolderName}
            onChange={e => setNewFolderName(e.target.value)}
            onKeyDown={handleNewFolderKey}
            placeholder="New list..."
            maxLength={60}
            className="flex-1 min-w-0 bg-transparent border-0 outline-none focus:ring-0 text-sm text-text-primary dark:text-text-dark-primary placeholder:text-text-secondary dark:placeholder:text-text-dark-secondary"
          />
          {newFolderName && (
            <button
              type="button"
              onClick={() => setNewFolderName('')}
              aria-label="Clear"
              className="p-1 rounded-md text-text-secondary dark:text-text-dark-secondary hover:text-text-primary dark:hover:text-text-dark-primary"
            >
              <XMarkIcon className="size-4 shrink-0" />
            </button>
          )}
        </div>
      </div>
    </aside>
  )
}

export { Sidebar }
