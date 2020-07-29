import React, { useEffect, useState } from 'react'

import firebase, { databaseRef } from 'Service/firebase'
import { Header } from 'Components/Header'
import { LoginForm } from 'Components/LoginForm'
import {
    GlobalStyle,
    StyledAddTask,
    StyledCheckbox,
    StyledLayout,
    StyledTaskName,
    StyledTodo,
    StyledDeleteButton,
    StyledTodos,
} from './style'
import { Delete } from './delete'

import { GlobalLazyImageStyle } from '../LazyImage/style'

type Todo = {
    task: string
    done: boolean
    useruid: string
    id?: string
    createdAt?: number
}

type User = {
    id: string
    avatar: string
    email: string
    fullName: string
}

const INITIAL_USER: User = { id: '', email: '', avatar: '', fullName: '' }

const Layout = () => {
    const [todos, setTodos] = useState<Todo[]>([])
    const [user, setUser] = useState<User>(INITIAL_USER)
    const [currentTodo, setCurrentTodo] = useState<string>('')

    const loginWithGoogle = async () => {
        const provider = new firebase.auth.GoogleAuthProvider()

        try {
            const result = await firebase.auth().signInWithPopup(provider)

            // const token = result.credential.accessToken
            // The signed-in user info.
            const id = result.user?.uid || ''
            const email = result.user?.email || ''
            const avatar = result.user?.photoURL || ''
            const fullName = result.user?.displayName || ''

            const preparedUser = { id, avatar, email, fullName }
            window.localStorage.setItem('user', JSON.stringify(preparedUser))
            setUser(preparedUser)
        } catch (error) {
            // Handle Errors here.
            var errorCode = error.code
            var errorMessage = error.message
            // The email of the user's account used.
            var email = error.email
            // The firebase.auth.AuthCredential type that was used.
            var credential = error.credential
        }
    }

    const addTodo = (todo: string) => {
        const timestamp = +new Date()
        const value: Todo = {
            task: todo.slice(0, 100),
            done: false,
            useruid: user.id,
            createdAt: timestamp,
        }
        databaseRef.child(`todos/${user.id}`).push(value)
        setCurrentTodo('')
    }

    const keyHandle = (e: any) => {
        if (e.charCode === 13 && Boolean(e.target.value.length)) {
            const text = e.target.value
            setCurrentTodo('')
            addTodo(text)
        }
    }

    const toggleDone = (todo: Todo) => {
        const value: Todo = {
            task: todo.task,
            done: !todo.done,
            useruid: user.id,
            createdAt: todo.createdAt,
        }

        databaseRef.update({ [`todos/${user.id}/${todo.id}/`]: value })
    }

    const deleteTodo = (todo: Todo) => {
        databaseRef.update({ [`todos/${user.id}/${todo.id}/`]: null })
    }

    useEffect(() => {
        if (user.id) {
            databaseRef.child(`todos/${user.id}`).on('value', snapshot => {
                let items = snapshot.val() || []
                const prepareTodos: Todo[] = Object.keys(items)
                    .map(i => {
                        return {
                            id: i,
                            createdAt: items[i].createdAt,
                            task: items[i].task,
                            done: items[i].done,
                            useruid: items[i].useruid,
                        }
                    })
                    .sort((a, b) => b.createdAt - a.createdAt)
                setTodos(prepareTodos)
            })
        }
    }, [user])

    useEffect(() => {
        const userFromLocalStorage: string = window.localStorage.getItem('user') || ''
        const user = userFromLocalStorage ? JSON.parse(userFromLocalStorage) : INITIAL_USER

        if (user) {
            setUser(user)
        }
    }, [])

    const onLogout = () => {
        window.localStorage.removeItem('user')
        setUser(INITIAL_USER)
    }

    return (
        <StyledLayout>
            <GlobalStyle />
            <GlobalLazyImageStyle />

            <Header
                avatar={user.avatar}
                email={user.email}
                fullName={user.fullName}
                onLogout={onLogout}
            />

            {user.id && (
                <StyledTodos>
                    <StyledAddTask
                        value={currentTodo}
                        onChange={e => setCurrentTodo(e.target.value)}
                        onKeyPress={keyHandle}
                        placeholder="Add task..."
                    />

                    {todos.map(todo => {
                        return (
                            <StyledTodo key={todo.id}>
                                <StyledCheckbox
                                    isCompleted={todo.done}
                                    onClick={() => toggleDone(todo)}
                                />
                                <StyledTaskName isCompleted={todo.done}>{todo.task}</StyledTaskName>
                                <StyledDeleteButton onClick={() => deleteTodo(todo)}>
                                    <Delete />
                                </StyledDeleteButton>
                            </StyledTodo>
                        )
                    })}
                </StyledTodos>
            )}

            {!user.id && <LoginForm onLogin={loginWithGoogle} />}
        </StyledLayout>
    )
}

export { Layout }
