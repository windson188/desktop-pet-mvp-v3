export function loadAppState() {
  const raw = window.desktopPetAPI.loadState();

  if (Array.isArray(raw.todos)) {
    const oldTodos = raw.todos;
    const todos = oldTodos.filter(t => !t.done).map(({ id, text, createdAt }) => ({ id, text, createdAt }));
    const completedTodos = oldTodos.filter(t => t.done).map(({ id, text, completedAt, createdAt }) => ({
      id,
      text,
      completedAt: completedAt || Date.now(),
      createdAt: createdAt || Date.now()
    }));
    raw.todos = { todos, completedTodos };
  }

  return raw;
}

export function saveAppState(state) {
  return window.desktopPetAPI.saveState(state);
}