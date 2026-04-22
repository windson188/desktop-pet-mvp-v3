// src/renderer.js
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

let petState, todoState, reminderState, uiState;
let clickCount = 0;

let bubbleCycleTimer = null;
let isBubbleCycleRunning = false;
let resetPendingTimer = null;
let reminderTimeouts = [];

// ---------- 自定义模态框（用于编辑）----------
function showEditDialog(title, defaultValue = '') {
  return new Promise((resolve) => {
    const modal = document.getElementById('edit-modal');
    const modalTitle = document.getElementById('modal-title');
    const input = document.getElementById('modal-input');
    const confirmBtn = document.getElementById('modal-confirm');
    const cancelBtn = document.getElementById('modal-cancel');

    if (!modal) {
      console.error('模态框元素未找到，请确保 index.html 中包含 #edit-modal');
      resolve(null);
      return;
    }

    modalTitle.textContent = title;
    input.value = defaultValue;
    modal.classList.remove('hidden');

    const cleanup = () => {
      modal.classList.add('hidden');
      confirmBtn.removeEventListener('click', onConfirm);
      cancelBtn.removeEventListener('click', onCancel);
      input.removeEventListener('keypress', onKeyPress);
    };

    const onConfirm = () => {
      const value = input.value.trim();
      cleanup();
      resolve(value === '' ? null : value);
    };

    const onCancel = () => {
      cleanup();
      resolve(null);
    };

    const onKeyPress = (e) => {
      if (e.key === 'Enter') onConfirm();
    };

    confirmBtn.addEventListener('click', onConfirm);
    cancelBtn.addEventListener('click', onCancel);
    input.addEventListener('keypress', onKeyPress);
    input.focus();
    input.select();
  });
}

// 挂载到全局，供其他模块调用
window.showEditDialog = showEditDialog;

// ---------- 气泡控制 ----------
function getBubbleElement() {
  return document.getElementById("bubble");
}

function showBubble() {
  const bubble = getBubbleElement();
  if (bubble) bubble.classList.remove("hidden");
}

function hideBubble() {
  const bubble = getBubbleElement();
  if (bubble) bubble.classList.add("hidden");
}

function stopBubbleCycle() {
  if (bubbleCycleTimer) {
    clearTimeout(bubbleCycleTimer);
    bubbleCycleTimer = null;
  }
  if (resetPendingTimer) {
    clearTimeout(resetPendingTimer);
    resetPendingTimer = null;
  }
  isBubbleCycleRunning = false;
}

function startBubbleCycle() {
  if (!petState) return;
  if (isBubbleCycleRunning) stopBubbleCycle();
  isBubbleCycleRunning = true;

  const randomText = petState.getRandomLine();
  petState.setBubble(randomText);
  renderAll();
  showBubble();

  const showDuration = Math.floor(Math.random() * (15000 - 10000 + 1) + 10000);
  bubbleCycleTimer = setTimeout(() => {
    hideBubble();
    const hideDuration = Math.floor(Math.random() * (45000 - 35000 + 1) + 35000);
    bubbleCycleTimer = setTimeout(() => {
      startBubbleCycle();
    }, hideDuration);
  }, showDuration);
}

function resetBubbleCycle() {
  if (!petState) return;
  if (resetPendingTimer) clearTimeout(resetPendingTimer);
  stopBubbleCycle();
  const currentBubble = petState.getBubble();
  if (currentBubble && currentBubble.trim() !== '') {
    showBubble();
  }
  resetPendingTimer = setTimeout(() => {
    resetPendingTimer = null;
    startBubbleCycle();
  }, 5000);
}

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
      persist().then(() => {
        renderAll();
        updateWindowHeight();
        resetBubbleCycle();
      });
    },
    onDeleteTodo: (id) => {
      todoState.deleteTodo(id);
      persist().then(() => {
        renderAll();
        updateWindowHeight();
        resetBubbleCycle();
      });
    },
    onEditTodo: (id, newText) => {
      todoState.editTodo(id, newText);
      persist().then(() => {
        renderAll();
        updateWindowHeight();
        resetBubbleCycle();
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
        resetBubbleCycle();
      });
    },
    onCompleteReminder: (id, reminderText) => {
      petState.setBubble(`主人，你真棒，又完成${reminderText}了哦！`);
      reminderState.completeReminder(id);
      persist().then(() => {
        renderAll();
        updateWindowHeight();
        resetBubbleCycle();
      });
    },
    onDeleteCompletedTodo: (id) => {
      todoState.deleteCompletedTodo(id);
      persist().then(() => {
        renderAll();
        updateWindowHeight();
        resetBubbleCycle();
      });
    },
    onEditReminder: (id, newText) => {
      reminderState.editReminder(id, newText);
      persist().then(() => {
        renderAll();
        updateWindowHeight();
        resetBubbleCycle();
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

function scheduleReminder(reminder) {
  const now = Date.now();
  const delay = reminder.time - now;
  const executeReminder = () => {
    petState.setBubble(`主人，记得要${reminder.text}哦！`);
    renderAll();
    showBubble();
    updateWindowHeight();
    resetBubbleCycle();
    petState.applyReminderEffect();
    reminderState.completeReminder(reminder.id);
    persist().then(() => {
      renderAll();
      updateWindowHeight();
      resetBubbleCycle();
    });
  };
  if (delay <= 0) {
    executeReminder();
  } else {
    const timeoutId = setTimeout(() => {
      executeReminder();
      const index = reminderTimeouts.indexOf(timeoutId);
      if (index !== -1) reminderTimeouts.splice(index, 1);
    }, delay);
    reminderTimeouts.push(timeoutId);
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
    uiState.wakeUp();
    persist().then(() => {
      renderAll();
      updateWindowHeight();
      resetBubbleCycle();
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
      resetBubbleCycle();
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
    resetBubbleCycle();
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
    resetBubbleCycle();
  });

  pet?.addEventListener("click", () => {
    if (window.__isDraggingPet) return;
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
    petState.sayRandom();
    
    clickCount++;
    if (clickCount >= 10) {
      petState.addClickBond();
      clickCount = 0;
    }
    persist().then(() => {
      renderAll();
      updateWindowHeight();
      resetBubbleCycle();
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
        resetBubbleCycle();
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
        resetBubbleCycle();
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
    reminders.forEach(rem => scheduleReminder(rem));
    window.scheduleReminder = scheduleReminder;

    bindEvents();

    petState.startDecayTimer();

    window.addEventListener('beforeunload', () => {
      petState.stopDecayTimer();
      stopBubbleCycle();
      reminderTimeouts.forEach(id => clearTimeout(id));
      reminderTimeouts = [];
    });

    await updateWindowHeight();

    petState.setBubble("主人，你来啦！我可太想你了！");
    renderAll();
    showBubble();
    setTimeout(() => {
      hideBubble();
      const initialHideDuration = Math.floor(Math.random() * (20000 - 15000 + 1) + 15000);
      setTimeout(() => {
        startBubbleCycle();
      }, initialHideDuration);
    }, 10000);
  } catch (err) {
    console.error('初始化失败:', err);
    alert('桌面宠物初始化失败，请检查控制台错误信息。');
  }
}

init();