// src/ui/renderPet.js
import { startClapAnimation, stopClapAnimation } from './clapAnimation.js';
import { startEatAnimation, stopEatAnimation, isEatAnimating } from './eatAnimation.js';
import { startYoyoAnimation, stopYoyoAnimation, isYoyoAnimating, startIdleYoyoCheck, stopIdleCheck } from './yoyoAnimation.js';

export function renderPet({ petState, uiState }) {
  const petEl = document.getElementById("pet");
  const bubbleEl = document.getElementById("bubble");
  const bottomPanel = document.getElementById("bottom-panel");
  const todoPanel = document.getElementById("todo-panel");
  const reminderPanel = document.getElementById("reminder-panel");

  if (bubbleEl) bubbleEl.textContent = petState.getBubble();

  if (petEl) {
    const currentEmotion = petState.getEmotion();
    petEl.classList.remove('idle', 'happy', 'clap', 'eat', 'yoyo'); // 移除所有情绪类

    if (currentEmotion === 'clap') {
      // 鼓掌动画由 JS 驱动
      startClapAnimation(petEl, petState, () => renderPet({ petState, uiState }));
      petEl.classList.add('clap');
      // 停止闲置检测（有其他动画时）
      stopIdleCheck();
    } else if (currentEmotion === 'eat') {
      // 吃动画由 JS 驱动，已在播放则不再重复启动
      if (!isEatAnimating()) {
        startEatAnimation(petEl, petState, () => renderPet({ petState, uiState }));
      }
      petEl.classList.add('eat');
      // 停止闲置检测
      stopIdleCheck();
    } else if (currentEmotion === 'yoyo') {
      // yoyo 动画由 JS 驱动
      stopClapAnimation();
      stopEatAnimation();
      if (!isYoyoAnimating()) {
        startYoyoAnimation(petEl, petState, () => renderPet({ petState, uiState }));
      }
      petEl.classList.add('yoyo');
    } else {
      stopClapAnimation();
      stopEatAnimation();
      stopYoyoAnimation();

      // 清除 JS 内联的背景样式，任由 CSS 控制
      petEl.style.backgroundSize = '';
      petEl.style.backgroundPosition = '';
      petEl.style.backgroundImage = '';

      petEl.classList.add(currentEmotion);

      // CSS 动画结束后自动恢复 idle（happy 等）
      if (currentEmotion === 'happy') {
        const onAnimEnd = () => {
          if (petState.getEmotion() === currentEmotion) {
            petState.setEmotion('idle');
            renderPet({ petState, uiState });
          }
          petEl.removeEventListener('animationend', onAnimEnd);
        };
        petEl.addEventListener('animationend', onAnimEnd, { once: true });
      }

      // 当回到 idle 状态时，启动闲置轮播检测
      if (currentEmotion === 'idle') {
        startIdleYoyoCheck(petEl, petState, () => renderPet({ petState, uiState }));
      }
    }
  }

  // 底部按钮栏和面板显隐控制
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
