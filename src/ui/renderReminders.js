function formatTime(timestamp) {
  const date = new Date(timestamp);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${month}/${day} ${hours}:${minutes}`;
}

function getReminderStatus(item) {
  const now = Date.now();
  if (item.time <= now) return "已超时";
  return "";
}

export function renderReminders({
  reminderState,
  completedTodos,
  onDeleteReminder,
  onCompleteReminder,
  onDeleteCompletedTodo,
  onEditReminder
}) {
  const reminderListEl = document.getElementById("reminder-list");
  const reminders = reminderState.getReminders();

  const sortedReminders = [...reminders].sort((a, b) => a.time - b.time);
  if (!sortedReminders.length) {
    reminderListEl.innerHTML = `<div class="list-item"><span class="text">还没有待提醒的事项</span></div>`;
  } else {
    reminderListEl.innerHTML = "";
    sortedReminders.forEach((item) => {
      const row = document.createElement("div");
      row.className = "list-item";

      const textSpan = document.createElement("span");
      textSpan.className = "text";
      textSpan.style.cursor = "pointer";
      textSpan.style.flex = "1";
      const status = getReminderStatus(item);
      const statusText = status ? ` / ${status}` : "";
      textSpan.textContent = `${item.text}（${formatTime(item.time)}${statusText}）`;
      textSpan.setAttribute("data-id", item.id);

      textSpan.addEventListener("dblclick", async (e) => {
        e.stopPropagation();
        const newText = await window.showEditDialog('编辑提醒内容', item.text);
        if (newText && newText.trim() !== '') {
          onEditReminder(item.id, newText.trim());
        }
      });

      const actionsDiv = document.createElement("div");
      actionsDiv.className = "actions";
      const completeBtn = document.createElement("button");
      completeBtn.textContent = "完成";
      completeBtn.addEventListener("click", () => onCompleteReminder(item.id, item.text));
      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "删除";
      deleteBtn.addEventListener("click", () => onDeleteReminder(item.id));
      actionsDiv.appendChild(completeBtn);
      actionsDiv.appendChild(deleteBtn);

      row.appendChild(textSpan);
      row.appendChild(actionsDiv);
      reminderListEl.appendChild(row);
    });
  }

  // 已完成待办部分（折叠）
  const completedSection = document.getElementById("completed-section");
  if (!completedSection) return;

  const contentDiv = completedSection.querySelector('.completed-content');
  if (contentDiv) {
    if (!completedTodos || completedTodos.length === 0) {
      contentDiv.innerHTML = `<div class="list-item"><span class="text">暂无已完成的待办</span></div>`;
    } else {
      contentDiv.innerHTML = completedTodos.map(todo => `
        <div class="list-item" data-id="${todo.id}">
          <span class="text">${todo.text}</span>
          <div class="actions">
            <button data-action="delete-completed-todo">删除</button>
          </div>
        </div>
      `).join('');
    }
  }

  const deleteBtns = completedSection.querySelectorAll('[data-action="delete-completed-todo"]');
  deleteBtns.forEach((btn, idx) => {
    btn.addEventListener('click', () => {
      const todoId = completedTodos?.[idx]?.id;
      if (todoId && onDeleteCompletedTodo) onDeleteCompletedTodo(todoId);
    });
  });

  const title = completedSection.querySelector('.section-title');
  const content = completedSection.querySelector('.completed-content');
  if (title && content && !title.hasListener) {
    let isExpanded = false;
    const toggle = () => {
      isExpanded = !isExpanded;
      content.style.display = isExpanded ? 'block' : 'none';
      title.innerHTML = isExpanded
        ? `📋 已完成待办（最近5条）<span style="font-size:12px;">(收起)</span>`
        : `📋 已完成待办（最近5条）<span style="font-size:12px;">(展开)</span>`;
    };
    title.addEventListener('click', toggle);
    title.hasListener = true;
  }
}