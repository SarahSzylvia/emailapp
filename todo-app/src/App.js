import React, { useState } from 'react';
import './App.css';

function App() {
  const [todos, setTodos] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [newTodo, setNewTodo] = useState({ description: '', priority: 'low' });

  const addTodo = () => {
    if (newTodo.description.trim()) {
      const todo = {
        id: Date.now(),
        description: newTodo.description,
        priority: newTodo.priority,
        completed: false
      };
      setTodos([...todos, todo]);
      setNewTodo({ description: '', priority: 'low' });
      setShowForm(false);
    }
  };

  const toggleTodo = (id) => {
    setTodos(todos.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const deleteTodo = (id) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  const getPriorityClass = (priority) => {
    switch (priority) {
      case 'high': return 'priority-high';
      case 'medium': return 'priority-medium';
      case 'low': return 'priority-low';
      default: return 'priority-low';
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Todo App</h1>
        <button 
          className="new-todo-btn"
          onClick={() => setShowForm(true)}
        >
          + New todo
        </button>
      </header>

      <main className="app-main">
        <div className="todos-container">
          {todos.length === 0 ? (
            <p className="no-todos">No todos yet. Create your first todo!</p>
          ) : (
            <div className="todos-list">
              {todos.map(todo => (
                <div 
                  key={todo.id} 
                  className={`todo-item ${getPriorityClass(todo.priority)} ${todo.completed ? 'completed' : ''}`}
                >
                  <div className="todo-content">
                    <input
                      type="checkbox"
                      checked={todo.completed}
                      onChange={() => toggleTodo(todo.id)}
                      className="todo-checkbox"
                    />
                    <div className="todo-details">
                      <p className="todo-description">{todo.description}</p>
                      <span className="todo-priority">Priority: {todo.priority}</span>
                    </div>
                  </div>
                  <button 
                    className="delete-btn"
                    onClick={() => deleteTodo(todo.id)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Create New Todo</h2>
            <form onSubmit={(e) => { e.preventDefault(); addTodo(); }}>
              <div className="form-group">
                <label htmlFor="description">Description:</label>
                <textarea
                  id="description"
                  value={newTodo.description}
                  onChange={(e) => setNewTodo({ ...newTodo, description: e.target.value })}
                  placeholder="Enter todo description..."
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="priority">Priority:</label>
                <select
                  id="priority"
                  value={newTodo.priority}
                  onChange={(e) => setNewTodo({ ...newTodo, priority: e.target.value })}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => setShowForm(false)} className="cancel-btn">
                  Cancel
                </button>
                <button type="submit" className="save-btn">
                  Save Todo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
