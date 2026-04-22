// src/ui/dragController.js
export function setupDragController({ onDragStart, onDragEnd }) {
  const pet = document.getElementById("pet");
  if (!pet) return;

  let dragging = false;
  let moved = false;
  let startMouseX = 0;
  let startMouseY = 0;
  let startWindowX = 0;
  let startWindowY = 0;

  window.__isDraggingPet = false;

  pet.addEventListener("mousedown", async (e) => {
    if (e.button !== 0) return;

    dragging = true;
    moved = false;
    window.__isDraggingPet = true;  // 立即标记，阻止高度调整

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

    if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
      if (!moved) moved = true;
    }

    const nextX = startWindowX + deltaX;
    const nextY = startWindowY + deltaY;
    await window.desktopPetAPI.setWindowPosition(nextX, nextY);
  });

  async function finishDrag() {
    if (!dragging) return;
    dragging = false;
    document.body.style.userSelect = "";
    const finalPos = await window.desktopPetAPI.getWindowPosition();
    setTimeout(() => {
      window.__isDraggingPet = false;
    }, 100);
    if (onDragEnd) onDragEnd(finalPos, moved);
  }

  window.addEventListener("mouseup", finishDrag);
  window.addEventListener("mouseleave", finishDrag);
}