// src/ui/inputController.js
let currentInputType = null; // 缓存当前激活的输入框类型

export function setupInputController({
  uiState,
  todoState,
  reminderState,
  onStateChange
}) {
  const inputArea = document.getElementById("input-area");
  const activeInput = uiState.getActiveInput();

  // 如果没有激活的输入框，隐藏并清空内容
  if (!activeInput) {
    inputArea.classList.add("hidden");
    inputArea.innerHTML = "";
    currentInputType = null;
    return;
  }

  // 如果当前输入框已经存在且类型相同，则只做定位，不重新创建
  if (currentInputType === activeInput && !inputArea.classList.contains("hidden")) {
    // 仅更新位置
    requestAnimationFrame(() => {
      const buttonBar = document.getElementById("bottom-panel");
      if (buttonBar) {
        const buttonRect = buttonBar.getBoundingClientRect();
        const appEl = document.getElementById("app");
        if (appEl) {
          const appRect = appEl.getBoundingClientRect();
          let left = buttonRect.left - appRect.left;
          let top = buttonRect.top - appRect.top - inputArea.offsetHeight;
          if (top < 0) top = 0;
          if (left + inputArea.offsetWidth > appRect.width) left = appRect.width - inputArea.offsetWidth;
          if (left < 0) left = 0;
          inputArea.style.left = `${left}px`;
          inputArea.style.top = `${top}px`;
        }
      }
    });
    return;
  }

  // 否则，重新创建输入框内容
  currentInputType = activeInput;
  inputArea.classList.remove("hidden");

  // 根据类型渲染内容
  if (activeInput === "todo") {
    inputArea.innerHTML = `
      <div class="input-row">
        <input id="todo-input" type="text" placeholder="输入待办内容" />
        <div class="input-actions">
          <button id="todo-cancel">取消</button>
          <button id="todo-submit">添加</button>
        </div>
      </div>
    `;

    const todoInput = document.getElementById("todo-input");
    const cancelBtn = document.getElementById("todo-cancel");
    const submitBtn = document.getElementById("todo-submit");

    cancelBtn.addEventListener("click", () => {
      uiState.toggleInput("todo");
      onStateChange();
    });

    submitBtn.addEventListener("click", () => {
      const value = todoInput.value;
      todoState.addTodo(value);
      uiState.toggleInput("todo");
      onStateChange();
    });

    todoInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        const value = todoInput.value;
        todoState.addTodo(value);
        uiState.toggleInput("todo");
        onStateChange();
      }
    });

    todoInput.focus();
  }

  if (activeInput === "reminder") {
    inputArea.innerHTML = `
      <div class="input-row">
        <input id="reminder-text" type="text" placeholder="输入提醒内容" />
        <input id="reminder-time" type="datetime-local" />
        <div class="input-actions">
          <button id="reminder-cancel">取消</button>
          <button id="reminder-submit">添加</button>
        </div>
      </div>
    `;

    const reminderText = document.getElementById("reminder-text");
    const reminderTime = document.getElementById("reminder-time");
    const cancelBtn = document.getElementById("reminder-cancel");
    const submitBtn = document.getElementById("reminder-submit");

    cancelBtn.addEventListener("click", () => {
      uiState.toggleInput("reminder");
      onStateChange();
    });

    submitBtn.addEventListener("click", () => {
      const text = reminderText.value;
      const timeValue = reminderTime.value;

      if (!timeValue) return;

      const timestamp = new Date(timeValue).getTime();
      reminderState.addReminder(text, timestamp);

      const reminders = reminderState.getReminders();
      const latest = reminders[0];
      if (latest && window.scheduleReminder) {
        window.scheduleReminder(latest);
      }

      uiState.toggleInput("reminder");
      onStateChange();
    });

    reminderText.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        submitBtn.click();
      }
    });

    reminderText.focus();
  }

  // 定位输入框
  requestAnimationFrame(() => {
    const buttonBar = document.getElementById("bottom-panel");
    if (buttonBar) {
      const buttonRect = buttonBar.getBoundingClientRect();
      const appEl = document.getElementById("app");
      if (appEl) {
        const appRect = appEl.getBoundingClientRect();
        let left = buttonRect.left - appRect.left;
        let top = buttonRect.top - appRect.top - inputArea.offsetHeight;
        if (top < 0) top = 0;
        if (left + inputArea.offsetWidth > appRect.width) left = appRect.width - inputArea.offsetWidth;
        if (left < 0) left = 0;
        inputArea.style.left = `${left}px`;
        inputArea.style.top = `${top}px`;
      }
    }
  });
}