// src/ui/bubbleController.js

let bubbleCycleTimer = null;
let isBubbleCycleRunning = false;
let resetPendingTimer = null;

function getBubbleElement() {
  return document.getElementById("bubble");
}

export function showBubble() {
  const bubble = getBubbleElement();
  if (bubble) bubble.classList.remove("hidden");
}

export function hideBubble() {
  const bubble = getBubbleElement();
  if (bubble) bubble.classList.add("hidden");
}

export function stopBubbleCycle() {
  if (bubbleCycleTimer) {
    clearTimeout(bubbleCycleTimer);
    bubbleCycleTimer = null;
  }
  if (resetPendingTimer) {
    clearTimeout(resetPendingTimer);
    resetPendingTimer = null;
  }
  isBubbleCycleRunning = false;
}

export function startBubbleCycle({ petState, renderAll }) {
  if (!petState) return;
  if (isBubbleCycleRunning) stopBubbleCycle();
  isBubbleCycleRunning = true;

  const randomText = petState.getRandomLine();
  petState.setBubble(randomText);
  renderAll();
  showBubble();

  const showDuration = Math.floor(Math.random() * (15000 - 10000 + 1) + 10000);
  bubbleCycleTimer = setTimeout(() => {
    hideBubble();
    const hideDuration = Math.floor(Math.random() * (45000 - 35000 + 1) + 35000);
    bubbleCycleTimer = setTimeout(() => {
      startBubbleCycle({ petState, renderAll });
    }, hideDuration);
  }, showDuration);
}

export function resetBubbleCycle({ petState, renderAll }) {
  if (!petState) return;
  if (resetPendingTimer) clearTimeout(resetPendingTimer);
  stopBubbleCycle();
  const currentBubble = petState.getBubble();
  if (currentBubble && currentBubble.trim() !== '') {
    showBubble();
  }
  resetPendingTimer = setTimeout(() => {
    resetPendingTimer = null;
    startBubbleCycle({ petState, renderAll });
  }, 5000);
}
