export function setupDragController({ onDragStart, onDragEnd }) {
  const pet = document.getElementById("pet");
  if (!pet) return;

  let dragging = false;
  let moved = false;
  let hasMovedBeyondThreshold = false;
    let hasAnyMovement = false;
  let isDraggingActive = false;
  const MOVE_THRESHOLD = 5;
  let startMouseX = 0, startMouseY = 0;
  let startWindowX = 0, startWindowY = 0;

  window._disablePetClick = false;

  pet.addEventListener("mousedown", async (e) => {
    if (e.button !== 0) return;

        dragging = true;
    moved = false;
    hasMovedBeyondThreshold = false;
    hasAnyMovement = false;
    isDraggingActive = false;
    window._disablePetClick = false;
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

        if (deltaX !== 0 || deltaY !== 0) {
      hasAnyMovement = true;
      if (!isDraggingActive) {
        isDraggingActive = true;
        window._disablePetClick = true;
      }
    }

    if (!hasMovedBeyondThreshold && (Math.abs(deltaX) > MOVE_THRESHOLD || Math.abs(deltaY) > MOVE_THRESHOLD)) {
      hasMovedBeyondThreshold = true;
      moved = true;
    }

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

    if (isDraggingActive) {
            setTimeout(() => {
        window._disablePetClick = false;
      }, 200);
    } else {
      window._disablePetClick = false;
        }

    setTimeout(() => {
      window.__isDraggingPet = false;
    }, 50);

    if (onDragEnd) onDragEnd(finalPos, moved);
  }

  window.addEventListener("mouseup", finishDrag);
  window.addEventListener("mouseleave", finishDrag);
}