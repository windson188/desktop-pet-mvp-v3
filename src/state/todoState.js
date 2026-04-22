export function createTodoState(initialState = {}) {
  let todos = [];
  let completedTodos = [];

  // 数据迁移兼容旧格式
  if (Array.isArray(initialState)) {
    const oldTodos = initialState;
    todos = oldTodos.filter(t => !t.done).map(({ id, text, createdAt }) => ({ id, text, createdAt }));
    completedTodos = oldTodos.filter(t => t.done).map(({ id, text, completedAt, createdAt }) => ({
      id,
      text,
      completedAt: completedAt || Date.now(),
      createdAt: createdAt || Date.now()
    }));
  } else if (initialState && typeof initialState === 'object') {
    todos = initialState.todos || [];
    completedTodos = initialState.completedTodos || [];
  }

  completedTodos.sort((a, b) => b.completedAt - a.completedAt);

  return {
    getState() {
      return { todos, completedTodos };
    },
    getTodos() {
      return todos;
    },
    getCompletedTodos() {
      return completedTodos;
    },
    addTodo(text) {
      if (!text || !text.trim()) return;
      todos.unshift({
        id: `todo_${Date.now()}`,
        text: text.trim(),
        createdAt: Date.now()
      });
    },
    // 编辑待办
    editTodo(id, newText) {
      if (!newText || !newText.trim()) return;
      const todo = todos.find(item => item.id === id);
      if (todo) {
        todo.text = newText.trim();
      }
    },
    completeTodo(id) {
      const index = todos.findIndex(item => item.id === id);
      if (index === -1) return;
      const completedItem = todos[index];
      const completedRecord = {
        id: completedItem.id,
        text: completedItem.text,
        completedAt: Date.now(),
        createdAt: completedItem.createdAt
      };
      todos = todos.filter(item => item.id !== id);
      completedTodos = [completedRecord, ...completedTodos];
      if (completedTodos.length > 5) {
        completedTodos = completedTodos.slice(0, 5);
      }
    },
    deleteTodo(id) {
      todos = todos.filter(item => item.id !== id);
    },
    deleteCompletedTodo(id) {
      completedTodos = completedTodos.filter(item => item.id !== id);
    }
  };
}