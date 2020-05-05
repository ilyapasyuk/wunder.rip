import React, {useState, useCallback, useEffect} from "react";
import AddTask from './AddTask'
import Todo from './Todo'
import useAudio from './Player'
import {GlobalStyles, StyledApp} from './style'

export default function App() {
    const [todos, setTodos] = useState([]);
    const [activeField, setActiveField] = useState("");
    const [playing, toggle] = useAudio('./wl3-complete.ogg');

    useEffect(() => {
        const existTodos = window.localStorage.getItem('todos')
        if (JSON.parse(existTodos)) saveTodos(JSON.parse(existTodos))
    }, [])

    const keyHandle = e => {
        if (e.charCode === 13 && Boolean(e.target.value.length)) {
            saveTodos([
                {text: e.target.value, isCompleted: false, id: todos.length},
                ...todos
            ]);
            setActiveField("");
        }
    };

    const onCompletedChange = ({id, value}) => {
        let foundTodo = todos.find(todo => todo.id === id);
        foundTodo.isCompleted = value;

        const newTodos = todos
            .map(todo => {
                if (todo.id === id) {
                    return foundTodo;
                }

                return todo;
            })
            .sort((a, b) => {
                return a.isCompleted > b.isCompleted;
            });

        if (value) {
            toggle()
        }

        saveTodos(newTodos);
    };

    const saveTodos = useCallback((todos) => {
        setTodos(todos)
        window.localStorage.setItem('todos', JSON.stringify(todos))
    }, [])

    return (
        <StyledApp>
            <AddTask activeField={activeField} keyHandle={keyHandle} onChange={setActiveField}/>

            {todos.map(todo => (
                <Todo
                    key={todo.id}
                    text={todo.text}
                    isCompleted={todo.isCompleted}
                    id={todo.id}
                    onCompletedChange={onCompletedChange}
                />
            ))}
            <GlobalStyles/>
        </StyledApp>
    );
}
