// src/ui/autoHide.js
export function setupAutoHide({ uiState, onHide }) {
  let timer = null;
  let isMouseInsideWindow = false; // 鼠标是否在应用窗口内

  // 清除计时器
  function clearTimer() {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  }

  // 获取当前应使用的延迟时间（毫秒）
  function getDelay() {
    return isMouseInsideWindow ? 30000 : 8000; // 窗口内30秒，窗口外8秒
  }

  // 启动计时器（如果处于唤醒状态）
  function startTimer() {
    if (!uiState.getIsAwake()) return;
    clearTimer();
    const delay = getDelay();
    timer = setTimeout(() => {
      // 只有当鼠标离开窗口后才真正执行隐藏
      if (uiState.getIsAwake()) {
        uiState.sleep();
        onHide();
      }
    }, delay);
  }

  // 重置计时器（由各种交互事件调用）
  function resetTimer() {
    if (!uiState.getIsAwake()) return;
    startTimer();
  }

  // 监听鼠标进入/离开窗口
  function initWindowMouseTracking() {
    document.body.addEventListener('mouseenter', () => {
      isMouseInsideWindow = true;
      resetTimer(); // 进入窗口，重置计时器（按30秒）
    });
    document.body.addEventListener('mouseleave', () => {
      isMouseInsideWindow = false;
      resetTimer(); // 离开窗口，重置计时器（按8秒）
    });
  }

  // 监听所有交互事件（鼠标移动、点击、按键等）
  const interactiveEvents = ['mousemove', 'click', 'keydown', 'scroll', 'wheel'];
  interactiveEvents.forEach(eventName => {
    window.addEventListener(eventName, resetTimer);
  });

  // 初始化鼠标追踪
  initWindowMouseTracking();

  // 初始启动计时器（假设鼠标在窗口外，8秒后隐藏）
  if (uiState.getIsAwake()) {
    startTimer();
  }

  // 返回 resetTimer 方法，供外部需要时手动重置（例如打开面板后）
  return {
    resetTimer
  };
}