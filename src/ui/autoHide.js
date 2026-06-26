export function setupAutoHide({ uiState, onHide }) {
  let timer = null;
  let isMouseInsideWindow = false;

  function clearTimer() {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  }

  function getDelay() {
    return isMouseInsideWindow ? 30000 : 8000;
  }

  // 检查是否处于“忙碌”状态（有面板或输入框），如果是就不启动自动隐藏
  function isBusy() {
    return uiState.getActivePanel() || uiState.getActiveInput();
  }

  function startTimer() {
    if (!uiState.getIsAwake() || isBusy()) {
      // 如果忙碌，清除任何等待中的隐藏任务
      clearTimer();
      return;
    }
    clearTimer();
    const delay = getDelay();
    timer = setTimeout(() => {
      if (uiState.getIsAwake() && !isBusy()) {
        uiState.sleep();
        onHide();
      }
    }, delay);
  }

  function resetTimer() {
    if (!uiState.getIsAwake()) return;
    startTimer();
  }

  let panelCloseTimer = null;

  function clearPanelCloseTimer() {
    if (panelCloseTimer) {
      clearTimeout(panelCloseTimer);
      panelCloseTimer = null;
    }
  }

  function isExportModalOpen() {
    const modal = document.getElementById("export-modal");
    return modal && !modal.classList.contains("hidden");
  }

  function closeExportModal() {
    const modal = document.getElementById("export-modal");
    if (modal) modal.classList.add("hidden");
  }

  function schedulePanelClose() {
    clearPanelCloseTimer();
    panelCloseTimer = setTimeout(() => {
      if (uiState.getActivePanel()) {
        uiState.setActivePanel(null);
      }
      closeExportModal();
      panelCloseTimer = null;
      onHide();
      startTimer();
    }, 10000);
  }

  function initWindowMouseTracking() {
    document.body.addEventListener('mouseenter', () => {
      isMouseInsideWindow = true;
      clearPanelCloseTimer();
      resetTimer();
    });
    document.body.addEventListener('mouseleave', () => {
      isMouseInsideWindow = false;
      if (uiState.getActivePanel() || isExportModalOpen()) {
        schedulePanelClose();
      }
      resetTimer();
    });
  }

  const interactiveEvents = ['mousemove', 'click', 'keydown', 'scroll', 'wheel'];
  interactiveEvents.forEach(eventName => {
    window.addEventListener(eventName, resetTimer);
  });

  initWindowMouseTracking();

  if (uiState.getIsAwake()) {
    startTimer();
  }

  return {
    resetTimer
  };
}