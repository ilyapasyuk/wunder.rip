import React, { useState } from "react";
import AddTask from './AddTask'
import Todo from './Todo'
import {GlobalStyles, StyledApp} from './style'

export default function App() {
  const [todos, setTodos] = useState([]);
  const [activeField, setActiveField] = useState("");

  const keyHandle = e => {
    if (e.charCode === 13 && Boolean(e.target.value.length)) {
      setTodos([
        { text: e.target.value, isCompleted: false, id: todos.length },
        ...todos
      ]);
      setActiveField("");
    }
  };

  const onCompletedChange = ({ id, value }) => {
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

    setTodos(newTodos);
  };

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
      <GlobalStyles />
    </StyledApp>
  );
}
