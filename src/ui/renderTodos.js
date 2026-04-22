export function renderTodos({ todoState, onCompleteTodo, onDeleteTodo, onEditTodo }) {
  const todoListEl = document.getElementById("todo-list");
  const todos = todoState.getTodos();

  if (!todos.length) {
    todoListEl.innerHTML = `
      <div class="list-item">
        <span class="text">还没有待办</span>
      </div>
    `;
    return;
  }

  todoListEl.innerHTML = "";

  todos.forEach((item) => {
    const row = document.createElement("div");
    row.className = "list-item";

    const textSpan = document.createElement("span");
    textSpan.className = "text";
    textSpan.style.cursor = "pointer";
    textSpan.style.flex = "1";
    textSpan.textContent = item.text;
    textSpan.setAttribute("data-id", item.id);

    // 双击编辑
    textSpan.addEventListener("dblclick", async (e) => {
      e.stopPropagation();
      const newText = await window.showEditDialog('编辑待办事项', item.text);
      if (newText && newText.trim() !== '') {
        onEditTodo(item.id, newText.trim());
      }
    });

    const actionsDiv = document.createElement("div");
    actionsDiv.className = "actions";
    const completeBtn = document.createElement("button");
    completeBtn.textContent = "完成";
    completeBtn.addEventListener("click", () => onCompleteTodo(item.id, item.text));
    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "删除";
    deleteBtn.addEventListener("click", () => onDeleteTodo(item.id));
    actionsDiv.appendChild(completeBtn);
    actionsDiv.appendChild(deleteBtn);

    row.appendChild(textSpan);
    row.appendChild(actionsDiv);
    todoListEl.appendChild(row);
  });
}