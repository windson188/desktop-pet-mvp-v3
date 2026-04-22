// src/window/resizeController.js
const MIN_WINDOW_HEIGHT = 280;
const MAX_WINDOW_HEIGHT = 880;

let pendingResize = null;

export async function updateWindowHeight() {
  // 如果正在拖动宠物，跳过高度调整，避免干扰拖拽
  if (window.__isDraggingPet) {
    return;
  }
  
  if (pendingResize) return;
  
  pendingResize = (async () => {
    await new Promise(requestAnimationFrame);
    await new Promise(requestAnimationFrame);

    const appEl = document.getElementById('app');
    if (!appEl) {
      pendingResize = null;
      return;
    }

    const uiState = window.uiState;
    const activePanel = uiState?.getActivePanel();
    const activeInput = uiState?.getActiveInput();

    const fixedArea = document.querySelector('.fixed-area');
    let fixedHeight = fixedArea ? fixedArea.scrollHeight : 0;

    if (activeInput) {
      const inputArea = document.getElementById("input-area");
      if (inputArea && !inputArea.classList.contains("hidden")) {
        let totalHeight = fixedHeight + inputArea.offsetHeight + 10;
        totalHeight = Math.min(MAX_WINDOW_HEIGHT, Math.max(MIN_WINDOW_HEIGHT, totalHeight));
        await window.desktopPetAPI.resizeWindow(totalHeight);
        requestAnimationFrame(() => {
          const buttonBar = document.getElementById("bottom-panel");
          if (buttonBar && inputArea) {
            const buttonRect = buttonBar.getBoundingClientRect();
            const appRect = appEl.getBoundingClientRect();
            let left = buttonRect.left - appRect.left;
            let top = buttonRect.top - appRect.top - inputArea.offsetHeight;
            if (top < 0) top = 0;
            if (left + inputArea.offsetWidth > appRect.width) left = appRect.width - inputArea.offsetWidth;
            if (left < 0) left = 0;
            inputArea.style.left = `${left}px`;
            inputArea.style.top = `${top}px`;
          }
        });
      } else {
        await window.desktopPetAPI.resizeWindow(MIN_WINDOW_HEIGHT);
      }
      pendingResize = null;
      return;
    }

    if (activePanel) {
      const panel = document.getElementById(`${activePanel}-panel`);
      if (panel && !panel.classList.contains("hidden")) {
        const originalPosition = panel.style.position;
        const originalDisplay = panel.style.display;
        panel.style.position = 'static';
        panel.style.display = 'block';
        const panelHeight = panel.scrollHeight;
        panel.style.position = originalPosition;
        panel.style.display = originalDisplay;
        
        let totalHeight = fixedHeight + panelHeight + 10;
        totalHeight = Math.min(MAX_WINDOW_HEIGHT, Math.max(MIN_WINDOW_HEIGHT, totalHeight));
        await window.desktopPetAPI.resizeWindow(totalHeight);
        
        if (window.repositionActivePanel) window.repositionActivePanel();
      } else {
        await window.desktopPetAPI.resizeWindow(MIN_WINDOW_HEIGHT);
      }
      pendingResize = null;
      return;
    }

    await window.desktopPetAPI.resizeWindow(MIN_WINDOW_HEIGHT);
    pendingResize = null;
  })();
}