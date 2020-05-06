import React, { useState, useCallback, useEffect } from 'react'
import Api from '../Services/api'
import AddTask from './AddTask'
import Todo from './Todo'
import useAudio from './Player'
import { useAuth0 } from '../react-auth0-spa'

export default function App() {
    const [todos, setTodos] = useState([])
    const [activeField, setActiveField] = useState('')
    const [playing, toggle] = useAudio('./wl3-complete.ogg')
    const { user } = useAuth0()

    useEffect(() => {
        getTasks(user.sub)
    }, [])

    const keyHandle = e => {
        if (e.charCode === 13 && Boolean(e.target.value.length)) {
            const text = e.target.value
            saveTodos([{ text, isCompleted: false, id: todos.length }, ...todos])
            setActiveField('')
            return createTask(text, user.sub)
        }
    }

    async function getTasks(user) {
        const params = { user }
        try {
            const tasks = await Api.get('http://localhost:3000/todos/', { params })
            saveTodos(tasks)
        } catch (e) {
            console.log('e', e)
        }
    }

    async function createTask(text, user) {
        const params = { text, user }
        try {
            const res = await Api.post('http://localhost:3000/todos', params)
            console.log('res', res)
        } catch (e) {
            console.log('e', e)
        }
    }

    const onCompletedChange = ({ id, value }) => {
        let foundTodo = todos.find(todo => todo.id === id)
        foundTodo.isCompleted = value

        const newTodos = todos
            .map(todo => {
                if (todo.id === id) {
                    return foundTodo
                }

                return todo
            })
            .sort((a, b) => {
                return a.isCompleted > b.isCompleted
            })

        if (value) {
            toggle()
        }

        saveTodos(newTodos)
    }

    const saveTodos = useCallback(todos => {
        setTodos(todos)
    }, [])

    return (
        <>
            <AddTask activeField={activeField} keyHandle={keyHandle} onChange={setActiveField} />

            {todos.map(todo => (
                <Todo
                    key={todo._id}
                    text={todo.text}
                    isCompleted={todo.isCompleted}
                    id={todo.id}
                    onCompletedChange={onCompletedChange}
                />
            ))}
        </>
    )
}
