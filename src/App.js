import React, { useState } from "react";
import "./styles.css";

const Todo = ({ isCompleted, text, id, onCompletedChange }) => {
  return (
    <div style={{ textAlign: "center" }}>
      <input
        type="checkbox"
        value={isCompleted}
        onChange={e => onCompletedChange({ value: e.target.checked, id })}
      />
      {text}
    </div>
  );
};

export default function App() {
  const [todos, setTodo] = useState([]);
  const [activeField, setActiveField] = useState("");

  const keyHandle = e => {
    if (e.charCode === 13 && Boolean(e.target.value.length)) {
      setTodo([
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

    setTodo(newTodos);
  };

  return (
    <div className="App">
      <input
        type="text"
        value={activeField}
        onChange={e => setActiveField(e.target.value)}
        onKeyPress={keyHandle}
      />

      {todos.map(todo => (
        <Todo
          key={todo.id}
          text={todo.text}
          isCompleted={todo.isCompleted}
          id={todo.id}
          onCompletedChange={onCompletedChange}
        />
      ))}
    </div>
  );
}
