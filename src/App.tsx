import React, { useEffect, useState } from 'react'

import './App.css'

import firebase, { databaseRef } from './firebase'

type Todo = {
    task: string
    done: boolean
    useruid: string
    id?: string
}

function App() {
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
        const value: Todo = {
            task: todo,
            done: false,
            useruid: user,
        }
        databaseRef.child(`todos/${user}`).push(value)
        setCurrentTodo('')
    }

    useEffect(() => {
        if (user) {
            databaseRef.child(`todos/${user}`).on('value', snapshot => {
                let items = snapshot.val()
                let newState = []
                for (let item in items) {
                    newState.push({
                        id: item,
                        task: items[item].task,
                        done: items[item].done,
                        useruid: items[item].useruid,
                    })
                }
                setTodos(newState)
            })
        }
    }, [user])

    return (
        <div className="App">
            <header className="App-header">
                {!user && <button onClick={loginWithGoogle}>Google</button>}
                {user && (
                    <>
                        {todos.length}
                        <input value={currentTodo} onChange={e => setCurrentTodo(e.target.value)} />
                        <button onClick={() => addTodo(currentTodo)} disabled={!currentTodo}>
                            add Todo
                        </button>
                    </>
                )}

                {todos.map(todo => {
                    return <div>{todo.task}</div>
                })}
            </header>
        </div>
    )
}

export default App
