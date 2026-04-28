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
import { showBubble, hideBubble, startBubbleCycle, resetBubbleCycle } from './ui/bubbleController.js';
import { showEditDialog } from './ui/modalController.js';
import { scheduleReminder, clearAllReminderTimeouts } from './state/reminderScheduler.js';

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

pet?.addEventListener("click", () => {
    // 如果正处于拖动模式或拖动刚结束后的禁止期，则不唤醒
    if (window._disablePetClick) return;

    // 原有的 dragJustHappened 判断可以保留
    if (dragJustHappened) {
      dragJustHappened = false;
      return;
    }
    // ... 其余代码保持不变
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