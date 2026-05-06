import { startClapAnimation, stopClapAnimation } from './clapAnimation.js';
import { startEatAnimation, stopEatAnimation, isEatAnimating } from './eatAnimation.js';
import { startYoyoAnimation, stopYoyoAnimation, isYoyoAnimating, startIdleYoyoCheck, stopIdleCheck } from './yoyoAnimation.js';
import { showBubble } from './bubbleController.js';  // 新增：引入显示气泡的方法

export function renderPet({ petState, uiState }) {
  const petEl = document.getElementById("pet");
  const bubbleEl = document.getElementById("bubble");
  const bottomPanel = document.getElementById("bottom-panel");
  const todoPanel = document.getElementById("todo-panel");
  const reminderPanel = document.getElementById("reminder-panel");

  if (bubbleEl) bubbleEl.textContent = petState.getBubble();

  if (petEl) {
    const currentEmotion = petState.getEmotion();
    petEl.classList.remove('idle', 'happy', 'clap', 'eat', 'yoyo');

    if (currentEmotion === 'clap') {
      startClapAnimation(petEl, petState, () => renderPet({ petState, uiState }));
      petEl.classList.add('clap');
      stopIdleCheck();
    } else if (currentEmotion === 'eat') {
      if (!isEatAnimating()) {
        startEatAnimation(petEl, petState, () => renderPet({ petState, uiState }));
      }
      petEl.classList.add('eat');
      stopIdleCheck();
    } else if (currentEmotion === 'yoyo') {
      stopClapAnimation();
      stopEatAnimation();
      if (!isYoyoAnimating()) {
        startYoyoAnimation(petEl, petState, () => renderPet({ petState, uiState }));
      }
      petEl.classList.add('yoyo');
      showBubble(); // 新增：悠悠球动画时强制显示气泡
    } else {
      stopClapAnimation();
      stopEatAnimation();
      if (isYoyoAnimating() || petState.getBubble() === `这招叫'风火轮'，酷不酷？`) {
        petState.setBubble('');
      }
      stopYoyoAnimation();

      petEl.style.backgroundSize = '';
      petEl.style.backgroundPosition = '';
      petEl.style.backgroundImage = '';

      petEl.classList.add(currentEmotion);

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

      if (currentEmotion === 'idle') {
        startIdleYoyoCheck(petEl, petState, () => renderPet({ petState, uiState }));
      }
    }
  }

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