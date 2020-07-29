import React, { useEffect, useState } from 'react'

import firebase, { databaseRef } from 'Service/firebase'
import {
    GlobalStyle,
    StyledAddTask,
    StyledCheckbox,
    StyledLayout,
    StyledTaskName,
    StyledTodo,
    StyledDeleteButton,
} from './style'
import { Delete } from './delete'

type Todo = {
    task: string
    done: boolean
    useruid: string
    id?: string
    createdAt?: number
}

const Layout = () => {
    const [todos, setTodos] = useState<Todo[]>([])
    const [user, setUser] = useState<string>('')
    const [currentTodo, setCurrentTodo] = useState<string>('')

    const loginWithGoogle = async () => {
        const provider = new firebase.auth.GoogleAuthProvider()

        try {
            const result = await firebase.auth().signInWithPopup(provider)

            // const token = result.credential.accessToken
            // The signed-in user info.
            const user = result.user?.uid || ''
            window.localStorage.setItem('user', user)
            setUser(user)
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
            task: todo,
            done: false,
            useruid: user,
            createdAt: timestamp,
        }
        databaseRef.child(`todos/${user}`).push(value)
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
            useruid: user,
            createdAt: todo.createdAt,
        }

        databaseRef.update({ [`todos/${user}/${todo.id}/`]: value })
    }

    const deleteTodo = (todo: Todo) => {
        databaseRef.update({ [`todos/${user}/${todo.id}/`]: null })
    }

    useEffect(() => {
        if (user) {
            databaseRef.child(`todos/${user}`).on('value', snapshot => {
                let items = snapshot.val() || []
                const prepareTodos: Todo[] = Object.keys(items)
                    .map(i => {
                        console.log('createdAt', items[i].createdAt)
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
        const user = window.localStorage.getItem('user') || ''

        if (user) {
            setUser(user)
        }
    }, [])

    return (
        <StyledLayout>
            <GlobalStyle />
            {!user && <button onClick={loginWithGoogle}>Google</button>}
            {user && (
                <>
                    <StyledAddTask
                        value={currentTodo}
                        onChange={e => setCurrentTodo(e.target.value)}
                        onKeyPress={keyHandle}
                        placeholder="Add task..."
                    />
                </>
            )}

            {todos.map(todo => {
                return (
                    <StyledTodo key={todo.id}>
                        <StyledCheckbox isCompleted={todo.done} onClick={() => toggleDone(todo)} />
                        <StyledTaskName isCompleted={todo.done}>{todo.task}</StyledTaskName>
                        <StyledDeleteButton onClick={() => deleteTodo(todo)}>
                            <Delete />
                        </StyledDeleteButton>
                    </StyledTodo>
                )
            })}
        </StyledLayout>
    )
}

export { Layout }
