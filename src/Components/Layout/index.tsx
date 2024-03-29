import React, { lazy, useEffect, useState } from 'react'
import { Toaster, toast } from 'sonner'

import { INITIAL_USER, IUser, PROVIDER, logOut, signIn } from 'service/auth'
import { databaseRef } from 'service/firebase'
import { getUserRoute } from 'service/routes'
import { ITodo, createTodo, deleteTodo, updateAllTask, updateTask } from 'service/task'

import { Header } from 'Components/Header'
import { LoginForm } from 'Components/LoginForm'

const TaskPreview = lazy(() => import('Components/TaskPreview'))
const TodoList = lazy(() => import('Components/TodoList'))

const Layout = () => {
  const [todos, setTodos] = useState<ITodo[]>([])
  const [user, setUser] = useState<IUser>(INITIAL_USER)
  const [currentTodo, setCurrentTodo] = useState<string>('')
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)

  const selectedTask = todos.find(todo => todo.id === selectedTaskId)

  const login = async (provider: PROVIDER): Promise<void> => {
    const { user } = await signIn(provider)
    if (user) {
      toast.success('Login success')
      setUser(user)
    }
  }

  const addTodo = async (todo: string): Promise<void> => {
    await createTodo(todo, user.id)
    setCurrentTodo('')
  }

  const keyHandle = async (e: any) => {
    if (e.charCode === 13 && Boolean(e.target.value.length)) {
      const text = e.target.value
      setCurrentTodo('')
      await addTodo(text)
    }
  }

  const toggleDone = async (todo: ITodo) => {
    const value: ITodo = {
      ...todo,
      done: !todo.done,
    }

    if (todo.id) {
      await updateTask(value, user.id)
    }
  }

  const deleteTodoHandler = async (todo: ITodo) => {
    await deleteTodo(todo, user.id)
  }

  useEffect(() => {
    if (user.id) {
      databaseRef.child(getUserRoute(user.id)).on('value', snapshot => {
        let items = snapshot.val() || []
        const prepareTodos: ITodo[] = Object.keys(items)
          .map(i => {
            return {
              id: i,
              createdAt: items[i].createdAt,
              task: items[i].task,
              done: items[i].done,
              useruid: items[i].useruid,
              note: items[i].note,
              files: items[i].files,
              order: items[i].order || 0,
            }
          })
          .sort((a, b) => a.order - b.order)
        setTodos(prepareTodos)
      })
    }
  }, [user])

  useEffect(() => {
    const userFromLocalStorage: string = window.localStorage.getItem('user') || ''
    const user: IUser = userFromLocalStorage ? JSON.parse(userFromLocalStorage) : INITIAL_USER

    if (user) {
      setUser(user)
    }
  }, [])

  const onLogout = async (): Promise<void> => {
    await logOut()
    setUser(INITIAL_USER)
  }

  const reorderTasks = async (dragIndex: number, hoverIndex: number) => {
    const dragItem = todos[dragIndex]
    const newItems = [...todos]
    newItems.splice(dragIndex, 1)
    newItems.splice(hoverIndex, 0, dragItem)

    newItems.forEach((item, index) => {
      item.order = index
    })

    await updateAllTask(newItems, user.id)
  }

  return (
    <div className="bg-gray-100 h-full">
      <Header
        avatar={user.avatar}
        email={user.email}
        fullName={user.fullName}
        onLogout={onLogout}
      />

      {user.id && (
        <>
          <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8 py-8">
            <input
              type="text"
              value={currentTodo}
              autoFocus
              onChange={e => setCurrentTodo(e.target.value)}
              onKeyPress={keyHandle}
              placeholder="New task..."
              className="block w-full rounded-md border-0 px-4 py-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 mb-6"
            />

            <TodoList
              onSelect={id => setSelectedTaskId(id)}
              todos={todos}
              toggleDone={toggleDone}
              deleteTodo={deleteTodoHandler}
              moveItem={reorderTasks}
            />
          </div>

          <TaskPreview
            isShow={!!selectedTaskId}
            todo={selectedTask}
            onClose={() => setSelectedTaskId(null)}
            user={user}
          />
        </>
      )}

      {!user.id && <LoginForm onLogin={login} />}
      <Toaster />
    </div>
  )
}

export { Layout }
