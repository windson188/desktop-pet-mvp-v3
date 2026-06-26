import { createPetState } from './state/petState.js';
import { createTodoState } from './state/todoState.js';
import { createReminderState } from './state/reminderState.js';
import { createUIState } from './state/uiState.js';
import { setupAutoHide } from './ui/autoHide.js';
import { setupDragController } from './ui/dragController.js';
import { setupInputController } from './ui/inputController.js';
import { renderPet, repositionActivePanel } from './ui/renderPet.js';
import { renderTodos } from './ui/renderTodos.js';
import { renderReminders } from './ui/renderReminders.js';
import { updateWindowHeight } from './window/resizeController.js';
import { showBubble, hideBubble, stopBubbleCycle, startBubbleCycle, resetBubbleCycle } from './ui/bubbleController.js';
import { showEditDialog } from './ui/modalController.js';
import { scheduleReminder, clearAllReminderTimeouts } from './state/reminderScheduler.js';
import { stopIdleCheck, setPendingIdleAnimIndex } from './ui/idleAnimations.js';


let petState, todoState, reminderState, uiState;
let clickCount = 0;

window.showEditDialog = showEditDialog;

async function persist() {
  const state = {
    pet: petState.getState(),
    todos: todoState.getState(),
    reminders: reminderState.getState(),
    ui: uiState.getState(),
    window: { x: null, y: null }
  };
  await window.desktopPetAPI.saveState(state);
}

function updateInputArea() {
  setupInputController({
    uiState,
    todoState,
    reminderState,
    onStateChange: () => {
      persist().then(() => {
        renderAll();
        updateWindowHeight().then(() => {
          if (uiState.getActivePanel()) {
            repositionActivePanel(uiState);
          }
        });
      });
    }
  });
}

function renderAll() {
  renderPet({ petState, uiState });
  renderTodos({
    todoState,
    onCompleteTodo: (id, text) => {
      todoState.completeTodo(id);
      petState.setBubble(`主人，你真棒，又完成${text}了哦！`);
      petState.setEmotion('clap');
      persist().then(() => {
        renderAll();
        updateWindowHeight();
        resetBubbleCycle({ petState, renderAll });
      });
    },
    onDeleteTodo: (id) => {
      todoState.deleteTodo(id);
      persist().then(() => {
        renderAll();
        updateWindowHeight();
        resetBubbleCycle({ petState, renderAll });
      });
    },
    onEditTodo: (id, newText) => {
      todoState.editTodo(id, newText);
      persist().then(() => {
        renderAll();
        updateWindowHeight();
        resetBubbleCycle({ petState, renderAll });
      });
    }
  });
  renderReminders({
    reminderState,
    completedTodos: todoState.getCompletedTodos(),
    onDeleteReminder: (id) => {
      reminderState.deleteReminder(id);
      persist().then(() => {
        renderAll();
        updateWindowHeight();
        resetBubbleCycle({ petState, renderAll });
      });
    },
    onCompleteReminder: (id, reminderText) => {
      petState.setBubble(`主人，你真棒，又完成${reminderText}了哦！`);
      petState.setEmotion('clap');
      reminderState.completeReminder(id);
      persist().then(() => {
        renderAll();
        updateWindowHeight();
        resetBubbleCycle({ petState, renderAll });
      });
    },
    onDeleteCompletedTodo: (id) => {
      todoState.deleteCompletedTodo(id);
      persist().then(() => {
        renderAll();
        updateWindowHeight();
        resetBubbleCycle({ petState, renderAll });
      });
    },
    onEditReminder: (id, newText) => {
      reminderState.editReminder(id, newText);
      persist().then(() => {
        renderAll();
        updateWindowHeight();
        resetBubbleCycle({ petState, renderAll });
      });
    }
  });
  updateInputArea();

  if (uiState.getActivePanel()) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        repositionActivePanel(uiState);
      });
    });
  }
}

function bindEvents() {
  const feedBtn = document.getElementById("feed-btn");
  const petBtn = document.getElementById("pet-btn");
  const todoBtn = document.getElementById("todo-btn");
  const reminderBtn = document.getElementById("reminder-btn");
  const pet = document.getElementById("pet");

  let dragJustHappened = false;
  window.addEventListener('dragStartOccurred', () => { dragJustHappened = true; });
  window.addEventListener('dragEndOccurred', () => { setTimeout(() => { dragJustHappened = false; }, 100); });

  feedBtn?.addEventListener("click", () => {
    if (uiState.getActivePanel() || uiState.getActiveInput()) {
      uiState.setActivePanel(null);
      uiState.closeInput();
      renderAll();
      updateWindowHeight();
    }
    petState.feed();
    petState.setEmotion('eat');
    uiState.wakeUp();
    persist().then(() => {
      renderAll();
      updateWindowHeight();
      resetBubbleCycle({ petState, renderAll });
    });
  });

  petBtn?.addEventListener("click", () => {
    if (uiState.getActivePanel() || uiState.getActiveInput()) {
      uiState.setActivePanel(null);
      uiState.closeInput();
      renderAll();
      updateWindowHeight();
    }
    petState.setEmotion('happy');
    uiState.wakeUp();
    persist().then(() => {
      renderAll();
      updateWindowHeight();
      resetBubbleCycle({ petState, renderAll });
    });
  });

  todoBtn?.addEventListener("click", () => {
    if (uiState.getActivePanel() === 'todo') {
      uiState.setActivePanel(null);
    } else {
      uiState.setActivePanel('todo');
    }
    uiState.closeInput();
    uiState.wakeUp();
    renderAll();
    updateWindowHeight();
    resetBubbleCycle({ petState, renderAll });
  });

  reminderBtn?.addEventListener("click", () => {
    if (uiState.getActivePanel() === 'reminder') {
      uiState.setActivePanel(null);
    } else {
      uiState.setActivePanel('reminder');
    }
    uiState.closeInput();
    uiState.wakeUp();
    renderAll();
    updateWindowHeight();
    resetBubbleCycle({ petState, renderAll });
  });

  const CLICK_REACTIONS = [
    { type: 'idle', animIndex: 0, bubble: "这招叫'风火轮'，酷不酷？" },
    { type: 'idle', animIndex: 1, bubble: '伸个懒腰，好舒服~' },
    { type: 'idle', animIndex: 2, bubble: '摇摇尾巴，真开心！' },
    { type: 'idle', animIndex: 3, bubble: '' },
    { type: 'happy', animIndex: -1, bubble: '嘿嘿，被摸摸了' },
    { type: 'clap', animIndex: -1, bubble: '主人，你真棒！' }
  ];

  pet?.addEventListener("click", () => {
    if (window._disablePetClick) return;

    if (dragJustHappened) {
      dragJustHappened = false;
      return;
    }
    if (uiState.getActivePanel() || uiState.getActiveInput()) {
      uiState.setActivePanel(null);
      uiState.closeInput();
      renderAll();
      updateWindowHeight();
    }
    uiState.wakeUp();

    clickCount++;
    if (clickCount >= 10) {
      petState.addClickBond();
      clickCount = 0;
    } else {
      const reaction = CLICK_REACTIONS[Math.floor(Math.random() * CLICK_REACTIONS.length)];
      petState.setBubble(reaction.bubble);
      if (reaction.type === 'idle') {
        setPendingIdleAnimIndex(reaction.animIndex);
        petState.setEmotion('yoyo');
      } else {
        petState.setEmotion(reaction.type);
      }
    }
    persist().then(() => {
      renderAll();
      updateWindowHeight();
      resetBubbleCycle({ petState, renderAll });
    });
  });

  pet?.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    const existingMenu = document.querySelector('.status-context-menu');
    if (existingMenu) existingMenu.remove();

    const mood = petState.getMood();
    const energy = petState.getEnergy();
    const bond = petState.getBond();

    const menu = document.createElement('div');
    menu.className = 'status-context-menu';
    menu.innerHTML = `
      <div>😊 心情: ${mood}</div>
      <div>⚡ 精力: ${energy}</div>
      <div>❤️ 亲密度: ${bond}</div>
    `;
    document.body.appendChild(menu);

    menu.style.left = `${e.clientX + 12}px`;
    menu.style.top = `${e.clientY + 8}px`;

    const rect = menu.getBoundingClientRect();
    const viewWidth = window.innerWidth;
    const viewHeight = window.innerHeight;
    if (rect.right > viewWidth) {
      menu.style.left = `${e.clientX - rect.width - 8}px`;
    }
    if (rect.bottom > viewHeight) {
      menu.style.top = `${e.clientY - rect.height - 8}px`;
    }

    const closeHandler = (ev) => {
      if (!menu.contains(ev.target)) {
        menu.remove();
        document.removeEventListener('click', closeHandler);
        document.removeEventListener('contextmenu', closeHandler);
      }
    };
    setTimeout(() => {
      document.addEventListener('click', closeHandler);
      document.addEventListener('contextmenu', closeHandler);
    }, 0);
  });

  const exportBtn = document.getElementById("export-todo-btn");
  exportBtn?.addEventListener("click", () => {
    const exportModal = document.getElementById("export-modal");
    const monthRow = document.getElementById("export-month-row");
    const monthPicker = document.getElementById("export-month-picker");
    const radioAll = exportModal.querySelector('input[value="all"]');
    const radioMonth = exportModal.querySelector('input[value="month"]');

    radioAll.checked = true;
    monthRow.style.display = "none";
    monthPicker.value = "";
    exportModal.classList.remove("hidden");

    const radioChange = () => {
      monthRow.style.display = radioMonth.checked ? "block" : "none";
    };
    radioAll.addEventListener("change", radioChange);
    radioMonth.addEventListener("change", radioChange);

    const cleanup = () => {
      exportModal.classList.add("hidden");
      radioAll.removeEventListener("change", radioChange);
      radioMonth.removeEventListener("change", radioChange);
      document.getElementById("export-cancel").removeEventListener("click", onCancel);
      document.getElementById("export-confirm").removeEventListener("click", onConfirm);
    };

    const doExport = async (monthFilter) => {
      const todos = todoState.getTodos();
      const completed = todoState.getCompletedTodos();

      let filteredCompleted = completed;
      if (monthFilter) {
        const [year, month] = monthFilter.split("-").map(Number);
        const monthStart = new Date(year, month - 1, 1).getTime();
        const monthEnd = new Date(year, month, 0, 23, 59, 59, 999).getTime();
        filteredCompleted = completed.filter(
          (t) => t.completedAt >= monthStart && t.completedAt <= monthEnd
        );
      }

      const activeTodos = monthFilter ? [] : todos;
      if (!activeTodos.length && !filteredCompleted.length) return;

      const BOM = "﻿";
      const header = "序号,工作内容,登记时间,完成时间,状态";
      const rows = [];

      const allItems = [
        ...activeTodos.map((t, i) => ({ ...t, idx: i + 1, status: "进行中" })),
        ...filteredCompleted.map((t, i) => ({ ...t, idx: activeTodos.length + i + 1, status: "已完成" }))
      ];

      allItems.forEach((item) => {
        const createdAt = new Date(item.createdAt).toLocaleString("zh-CN");
        const completedAt = item.completedAt
          ? new Date(item.completedAt).toLocaleString("zh-CN")
          : "";
        const text = `"${(item.text || "").replace(/"/g, '""')}"`;
        rows.push(`${item.idx},${text},${createdAt},${completedAt},${item.status}`);
      });

      const csv = BOM + header + "\n" + rows.join("\n");
      const now = new Date();
      const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      const fileSuffix = monthFilter ? `_${monthFilter}` : "";
      await window.desktopPetAPI.saveFile({
        defaultName: `待办记录${fileSuffix}_${dateStr}.csv`,
        content: csv
      });
    };

    const onCancel = () => {
      cleanup();
    };

    const onConfirm = () => {
      const monthFilter = radioMonth.checked ? monthPicker.value : null;
      if (radioMonth.checked && !monthFilter) return;
      cleanup();
      doExport(monthFilter);
    };

    document.getElementById("export-cancel").addEventListener("click", onCancel);
    document.getElementById("export-confirm").addEventListener("click", onConfirm);
  });

  document.addEventListener('click', (e) => {
    const addBtn = e.target.closest('.add-btn');
    if (addBtn) {
      const type = addBtn.dataset.type;
      if (type) {
        uiState.setActiveInput(type);
        uiState.wakeUp();
        renderAll();
        updateWindowHeight();
        e.preventDefault();
        resetBubbleCycle({ petState, renderAll });
      }
    }
  });
}

async function init() {
  try {
    const appState = window.desktopPetAPI.loadState();

    petState = createPetState(appState.pet);
    todoState = createTodoState(appState.todos);
    reminderState = createReminderState(appState.reminders);
    uiState = createUIState(appState.ui);

    uiState.sleep();
    uiState.setActivePanel(null);

    const { x, y } = appState.window;
    if (typeof x === 'number' && typeof y === 'number' && !isNaN(x) && !isNaN(y)) {
      await window.desktopPetAPI.setWindowPosition(x, y);
    }

    renderAll();

    window.repositionActivePanel = () => repositionActivePanel(uiState);
    window.uiState = uiState;

    setupAutoHide({
      uiState,
      onHide: () => {
        renderAll();
        updateWindowHeight();
        resetBubbleCycle({ petState, renderAll });
      }
    });

    setupDragController({
      onDragStart: () => {},
      onDragEnd: async (pos, moved) => {
        if (moved) {
          const currentState = window.desktopPetAPI.loadState();
          currentState.window = { x: pos.x, y: pos.y };
          await window.desktopPetAPI.saveState(currentState);
        }
      }
    });

    let resizeTimer;
    window.addEventListener('resize', () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        repositionActivePanel(uiState);
      }, 100);
    });

    const reminders = reminderState.getReminders();
    const schedulerDeps = {
      petState,
      reminderState,
      renderAll: () => renderAll(),
      showBubble,
      resetBubbleCycle: (opts) => resetBubbleCycle(opts || { petState, renderAll: () => renderAll() }),
      persist: () => persist(),
      updateWindowHeight: () => updateWindowHeight()
    };
    reminders.forEach(rem => scheduleReminder(rem, schedulerDeps));
    window.scheduleReminder = (rem) => scheduleReminder(rem, schedulerDeps);

    bindEvents();

    petState.startDecayTimer();

    window.addEventListener('beforeunload', () => {
      petState.stopDecayTimer();
      stopBubbleCycle();
      stopIdleCheck();
      clearAllReminderTimeouts();
    });

    await updateWindowHeight();

    petState.setBubble("主人，你来啦！我可太想你了！");
    renderAll();
    showBubble();
    setTimeout(() => {
      hideBubble();
      const initialHideDuration = Math.floor(Math.random() * (20000 - 15000 + 1) + 15000);
      setTimeout(() => {
        startBubbleCycle({ petState, renderAll: () => renderAll() });
      }, initialHideDuration);
    }, 10000);
  } catch (err) {
    console.error('初始化失败:', err);
    alert('桌面宠物初始化失败，请检查控制台错误信息。');
  }
}

init();