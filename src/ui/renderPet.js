// src/ui/renderPet.js
export function renderPet({ petState, uiState }) {
  const petEl = document.getElementById("pet");
  const bubbleEl = document.getElementById("bubble");
  const bottomPanel = document.getElementById("bottom-panel");
  const todoPanel = document.getElementById("todo-panel");
  const reminderPanel = document.getElementById("reminder-panel");

  // 更新气泡文字
  if (bubbleEl) bubbleEl.textContent = petState.getBubble();

  // 更新宠物的 CSS 类（基于 emotion）
  if (petEl) {
    const currentEmotion = petState.getEmotion();
    petEl.classList.remove('idle', 'happy');
    petEl.classList.add(currentEmotion);

    if (currentEmotion === 'happy') {
      const onAnimEnd = () => {
        if (petState.getEmotion() === 'happy') {
          petState.setEmotion('idle');
          renderPet({ petState, uiState });
        }
        petEl.removeEventListener('animationend', onAnimEnd);
      };
      petEl.addEventListener('animationend', onAnimEnd, { once: true });
    }
  }

  // 控制底部按钮栏和面板的显隐
  if (uiState.getIsAwake()) {
    // 移除 hidden 类，并强制设置 display 为 flex（确保可见）
    bottomPanel.classList.remove("hidden");
    bottomPanel.style.display = 'flex';

    const activePanel = uiState.getActivePanel();
    if (activePanel === 'todo') {
      positionPanel(todoPanel, bottomPanel);
      todoPanel.classList.remove("hidden");
      reminderPanel.classList.add("hidden");
    } else if (activePanel === 'reminder') {
      positionPanel(reminderPanel, bottomPanel);
      reminderPanel.classList.remove("hidden");
      todoPanel.classList.add("hidden");
    } else {
      todoPanel.classList.add("hidden");
      reminderPanel.classList.add("hidden");
    }
  } else {
    bottomPanel.classList.add("hidden");
    bottomPanel.style.display = 'none';
    todoPanel.classList.add("hidden");
    reminderPanel.classList.add("hidden");
  }
}

function positionPanel(panel, buttonBar) {
  if (!panel || !buttonBar) return;

  panel.style.position = 'absolute';

  const buttonRect = buttonBar.getBoundingClientRect();

  const wasHidden = panel.classList.contains("hidden");
  if (wasHidden) panel.classList.remove("hidden");

  const originalMaxHeight = panel.style.maxHeight;
  const originalOverflowY = panel.style.overflowY;
  const originalDisplay = panel.style.display;
  panel.style.maxHeight = 'none';
  panel.style.overflowY = 'visible';
  panel.style.display = 'block';

  const naturalHeight = panel.offsetHeight;

  panel.style.maxHeight = originalMaxHeight;
  panel.style.overflowY = originalOverflowY;
  panel.style.display = originalDisplay;
  if (wasHidden) panel.classList.add("hidden");

  const OFFSET_Y = -10;
  const maxAllowedBottom = buttonRect.top + OFFSET_Y;
  const maxAvailableHeight = maxAllowedBottom;

  let finalHeight = naturalHeight;
  let top = maxAllowedBottom - naturalHeight;

  if (naturalHeight > maxAvailableHeight) {
    finalHeight = maxAvailableHeight;
    top = 0;
    panel.style.maxHeight = `${finalHeight}px`;
    panel.style.overflowY = 'auto';
  } else {
    panel.style.maxHeight = '';
    panel.style.overflowY = '';
  }

  panel.style.top = `${top}px`;
  panel.style.left = `${buttonRect.left}px`;
  panel.style.width = `${buttonRect.width}px`;
  panel.style.zIndex = '900';
}

export function repositionActivePanel(uiState) {
  const activePanel = uiState.getActivePanel();
  if (!activePanel) return;
  const panel = document.getElementById(`${activePanel}-panel`);
  const buttonBar = document.getElementById("bottom-panel");
  if (panel && buttonBar && !panel.classList.contains("hidden")) {
    positionPanel(panel, buttonBar);
  }
}