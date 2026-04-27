// src/ui/renderPet.js
import { startClapAnimation, stopClapAnimation } from './clapAnimation.js';

export function renderPet({ petState, uiState }) {
  const petEl = document.getElementById("pet");
  const bubbleEl = document.getElementById("bubble");
  const bottomPanel = document.getElementById("bottom-panel");
  const todoPanel = document.getElementById("todo-panel");
  const reminderPanel = document.getElementById("reminder-panel");

  if (bubbleEl) bubbleEl.textContent = petState.getBubble();

  if (petEl) {
    const currentEmotion = petState.getEmotion();
    petEl.classList.remove('idle', 'happy', 'clap');

    if (currentEmotion === 'clap') {
      // 鼓掌动画由 JS 驱动，每次重新开始
      startClapAnimation(petEl, petState, () => renderPet({ petState, uiState }));
      petEl.classList.add('clap');   // 仅用于设置背景图路径
    } else {
      // 停止可能残留的鼓掌动画
      stopClapAnimation();

      // 清除 JS 动画留下的内联样式，让 CSS 控制背景尺寸和位置
      petEl.style.backgroundSize = '';
      petEl.style.backgroundPosition = '';

      // 添加当前情绪类（idle 或 happy）
      petEl.classList.add(currentEmotion);

      // happy 动画结束后自动恢复 idle
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
  }

  // 底部按钮栏和面板显隐控制（与之前完全一致）
  if (uiState.getIsAwake()) {
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

  const origMaxH = panel.style.maxHeight;
  const origOverflow = panel.style.overflowY;
  const origDisplay = panel.style.display;
  panel.style.maxHeight = 'none';
  panel.style.overflowY = 'visible';
  panel.style.display = 'block';

  const naturalHeight = panel.offsetHeight;

  panel.style.maxHeight = origMaxH;
  panel.style.overflowY = origOverflow;
  panel.style.display = origDisplay;
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