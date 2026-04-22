export function loadAppState() {
  const raw = window.desktopPetAPI.loadState();
  // 迁移旧数据：如果 todos 是数组（旧格式），则转换为对象格式
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
  // 如果 raw.todos 已经是对象，则保持不变
  return raw;
}

export function saveAppState(state) {
  return window.desktopPetAPI.saveState(state);
}