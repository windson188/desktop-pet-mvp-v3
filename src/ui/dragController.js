// src/ui/dragController.js
export function setupDragController({ onDragStart, onDragEnd }) {
  const pet = document.getElementById("pet");
  if (!pet) return;

  let dragging = false;
  let moved = false;
  let hasMovedBeyondThreshold = false;
  let hasAnyMovement = false;          // 是否发生过任何移动（即使很小）
  let isDraggingActive = false;        // 是否真正进入拖动模式（移动过）
  const MOVE_THRESHOLD = 5;
  let startMouseX = 0, startMouseY = 0;
  let startWindowX = 0, startWindowY = 0;

  // 全局标志：禁止宠物点击唤醒
  window._disablePetClick = false;

  pet.addEventListener("mousedown", async (e) => {
    if (e.button !== 0) return;

    // 重置所有状态
    dragging = true;
    moved = false;
    hasMovedBeyondThreshold = false;
    hasAnyMovement = false;
    isDraggingActive = false;
    window._disablePetClick = false;   // 新的一按，先允许点击
    window.__isDraggingPet = true;

    startMouseX = e.screenX;
    startMouseY = e.screenY;

    const pos = await window.desktopPetAPI.getWindowPosition();
    startWindowX = pos.x;
    startWindowY = pos.y;

    document.body.style.userSelect = "none";

    if (onDragStart) onDragStart();
  });

  window.addEventListener("mousemove", async (e) => {
    if (!dragging) return;

    const deltaX = e.screenX - startMouseX;
    const deltaY = e.screenY - startMouseY;

    // 只要有任何移动就标记
    if (deltaX !== 0 || deltaY !== 0) {
      hasAnyMovement = true;
      // 第一次移动时，激活拖动模式并禁止点击唤醒
      if (!isDraggingActive) {
        isDraggingActive = true;
        window._disablePetClick = true;
      }
    }

    // 检查是否超过阈值（用于真正移动窗口）
    if (!hasMovedBeyondThreshold && (Math.abs(deltaX) > MOVE_THRESHOLD || Math.abs(deltaY) > MOVE_THRESHOLD)) {
      hasMovedBeyondThreshold = true;
      moved = true;
    }

    // 只有确认拖动后才移动窗口
    if (hasMovedBeyondThreshold) {
      const nextX = startWindowX + deltaX;
      const nextY = startWindowY + deltaY;
      await window.desktopPetAPI.setWindowPosition(nextX, nextY);
    }
  });

  async function finishDrag() {
    if (!dragging) return;
    dragging = false;
    document.body.style.userSelect = "";
    const finalPos = await window.desktopPetAPI.getWindowPosition();

    // 如果真正进入过拖动模式（有过移动），则延迟恢复点击能力
    if (isDraggingActive) {
      // 拖拽结束后 200ms 内禁止点击唤醒
      setTimeout(() => {
        window._disablePetClick = false;
      }, 200);
    } else {
      // 纯点击，保证不禁用
      window._disablePetClick = false;
    }

    // 延迟重置拖拽标志
    setTimeout(() => {
      window.__isDraggingPet = false;
    }, 50);

    if (onDragEnd) onDragEnd(finalPos, moved);
  }

  window.addEventListener("mouseup", finishDrag);
  window.addEventListener("mouseleave", finishDrag);
}