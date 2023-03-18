import React, { useEffect, useState } from 'react'

import firebase, { databaseRef } from 'Service/firebase'
import { getCreateTaskRoute, getUpdateTaskRoute, getUserRoute } from 'Service/routes'
import { updateAllTask, updateTask } from 'Service/task'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'

import { Header } from 'Components/Header'
import { LoginForm } from 'Components/LoginForm'
import { TodoList } from 'Components/TodoList'
import { TodoType } from 'Components/Todo'

export type User = {
    id: string
    avatar: string
    email: string
    fullName: string
}

const INITIAL_USER: User = { id: '', email: '', avatar: '', fullName: '' }

export enum PROVIDER {
    FACEBOOK = 'facebook',
    GOOGLE = 'google',
}

const Layout = () => {
    const [todos, setTodos] = useState<TodoType[]>([])
    const [user, setUser] = useState<User>(INITIAL_USER)
    const [currentTodo, setCurrentTodo] = useState<string>('')

    const getProvider = (provider: PROVIDER) => {
        switch (provider) {
            case PROVIDER.GOOGLE:
                return new firebase.auth.GoogleAuthProvider()
            case PROVIDER.FACEBOOK:
                return new firebase.auth.GithubAuthProvider()
        }
    }

    const login = async (provider: PROVIDER): Promise<void> => {
        try {
            const result = await firebase.auth().signInWithPopup(getProvider(provider))

            const id: string = result.user?.uid || ''
            const email: string = result.user?.email || ''
            const avatar: string = result.user?.photoURL || ''
            const fullName: string = result.user?.displayName || ''

            const preparedUser: User = { id, avatar, email, fullName }
            await window.localStorage.setItem('user', JSON.stringify(preparedUser))
            setUser(preparedUser)
        } catch (error) {
            console.error('Login error:', error)
        }
    }

    const addTodo = async (todo: string): Promise<void> => {
        const timestamp = +new Date()

        const value: TodoType = {
            task: todo.slice(0, 100).trim(),
            done: false,
            createdAt: timestamp,
            files: [],
            note: '',
            order: 0,
        }

        databaseRef.child(getCreateTaskRoute(user.id)).push(value)
        setCurrentTodo('')
    }

    const keyHandle = async (e: any) => {
        if (e.charCode === 13 && Boolean(e.target.value.length)) {
            const text = e.target.value
            setCurrentTodo('')
            await addTodo(text)
        }
    }

    const toggleDone = async (todo: TodoType) => {
        const value: TodoType = {
            ...todo,
            done: !todo.done,
        }

        if (todo.id) {
            await updateTask(value, user.id)
        }
    }

    const deleteTodo = async (todo: TodoType) => {
        if (todo.id) {
            await databaseRef.update({ [getUpdateTaskRoute(user.id, todo.id)]: null })
        }
    }

    useEffect(() => {
        if (user.id) {
            databaseRef.child(getUserRoute(user.id)).on('value', snapshot => {
                let items = snapshot.val() || []
                const prepareTodos: TodoType[] = Object.keys(items)
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
                console.log('prepareTodos', prepareTodos)
                setTodos(prepareTodos)
            })
        }
    }, [user])

    useEffect(() => {
        const userFromLocalStorage: string = window.localStorage.getItem('user') || ''
        const user: User = userFromLocalStorage ? JSON.parse(userFromLocalStorage) : INITIAL_USER

        if (user) {
            setUser(user)
        }
    }, [])

    const onLogout = async (): Promise<void> => {
        await window.localStorage.removeItem('user')
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

        // newItems.forEach((item, index) => {
        //     console.log(item.task, item.order)
        // })

        // await updateTask(updatedItem, user.id)
        // setTodos(newItems)
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
                <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8 py-8">
                    <input
                        type="text"
                        value={currentTodo}
                        onChange={e => setCurrentTodo(e.target.value)}
                        onKeyPress={keyHandle}
                        placeholder="New task..."
                        className="bg-white shadow rounded-lg mb-4 w-full px-4 py-4"
                    />

                    <DndProvider backend={HTML5Backend}>
                        <TodoList
                            todos={todos}
                            toggleDone={toggleDone}
                            deleteTodo={deleteTodo}
                            user={user}
                            moveItem={reorderTasks}
                        />
                    </DndProvider>
                </div>
            )}

            {!user.id && <LoginForm onLogin={login} />}
        </div>
    )
}

export { Layout }
