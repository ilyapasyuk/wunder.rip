import { StoreContext } from 'Components/Context/store'
import { TodoItem } from 'Components/Todo'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { onValue, ref } from 'firebase/database'
import { KeyboardEvent, useContext, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { trackTaskCompleted } from 'services/analytics'
import { db } from 'services/firebase'
import { Folder } from 'services/folder'
import { getFoldersRoute } from 'services/routes'
import { createTodo, deleteTodo, Todo, updateTask } from 'services/task'

interface TodoListProps {
  todos: Todo[]
  visibleTodos: Todo[]
}

const TodoList = ({ todos: _todos, visibleTodos }: TodoListProps) => {
  const { state } = useContext(StoreContext)
  const [folders, setFolders] = useState<Folder[]>([])
  const [currentTodo, setCurrentTodo] = useState<string>('')
  const navigate = useNavigate()

  const handleAddTodo = async (todo: string): Promise<void> => {
    if (state?.user?.id) {
      await createTodo(todo, state?.user?.id, state.currentFolderId)
      setCurrentTodo('')
    }
  }

  const handleKeyDown = async (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && e.currentTarget.value.length) {
      const text = e.currentTarget.value
      setCurrentTodo('')
      await handleAddTodo(text)
    }
  }

  const handleToggleDone = async (todo: Todo) => {
    const value: Todo = {
      ...todo,
      done: !todo.done,
    }

    if (todo.id && state?.user?.id) {
      await updateTask(value, state?.user?.id)
      trackTaskCompleted(!todo.done)
    }
  }

  useEffect(() => {
    if (!state?.user?.id) {
      setFolders([])
      return
    }
    const unsubscribe = onValue(ref(db, getFoldersRoute(state.user.id)), snapshot => {
      const items = snapshot.val() || {}
      const prepared: Folder[] = Object.keys(items).map(id => ({
        id,
        name: items[id].name,
        createdAt: items[id].createdAt,
        order: items[id].order || 0,
      }))
      setFolders(prepared)
    })
    return () => unsubscribe()
  }, [state.user])

  const ids = useMemo(() => visibleTodos.map(t => t.id || ''), [visibleTodos])

  const currentFolderName = useMemo(() => {
    if (!state.currentFolderId) return 'Inbox'
    return folders.find(f => f.id === state.currentFolderId)?.name || 'Inbox'
  }, [state.currentFolderId, folders])

  return (
    <div className="bg-background dark:bg-background-dark h-full min-h-screen">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-semibold text-text-primary dark:text-text-dark-primary mb-4">
          {currentFolderName}
        </h1>
        <input
          type="text"
          value={currentTodo}
          onChange={e => setCurrentTodo(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="New task..."
          className="block w-full rounded-lg border-0 px-4 py-4 text-text-primary dark:text-text-dark-primary bg-surface dark:bg-surface-dark shadow-sm ring-1 ring-inset ring-border dark:ring-border-dark placeholder:text-text-secondary dark:placeholder:text-text-dark-secondary focus:ring-2 focus:ring-inset focus:ring-primary sm:text-base leading-6 mb-6 transition-all"
        />

        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-3">
            {visibleTodos.map(todo => (
              <TodoItem
                key={todo.id}
                todo={todo}
                toggleDone={handleToggleDone}
                deleteTodo={() => {
                  if (state?.user?.id) {
                    deleteTodo(todo, state?.user?.id)
                  }
                }}
                onSelect={todo => {
                  if (todo.id) {
                    navigate(`/t/${todo.id}`)
                  }
                }}
              />
            ))}
          </div>
        </SortableContext>
      </div>
    </div>
  )
}

export { TodoList }
