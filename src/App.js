import React, { useState } from "react";
import "./styles.css";

const Todo = ({ isComplited, text, id, onCompletedChange, onTextChange }) => {
  return (
    <div style={{ textAlign: "center" }}>
      <input
        type="checkbox"
        value={isComplited}
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
    if (e.charCode === 13) {
      setTodo([
        { text: e.target.value, isComplited: false, id: todos.length },
        ...todos
      ]);
      setActiveField("");
    }
  };

  const onCompletedChange = ({ id, value }) => {
    let foundTodo = todos.find(todo => todo.id === id);
    foundTodo.isComplited = value;

    const newTodos = todos
      .map(todo => {
        if (todo.id === id) {
          return foundTodo;
        }

        return todo;
      })
      .sort((a, b) => {
        return a.isComplited > b.isComplited;
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
          isComplited={todo.isComplited}
          id={todo.id}
          onCompletedChange={onCompletedChange}
        />
      ))}
    </div>
  );
}
