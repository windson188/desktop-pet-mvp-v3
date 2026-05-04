
const FRAME_WIDTH = 180;
const FRAME_HEIGHT = 180;
const COLS = 10;
const ROWS = 5;
const TOTAL_FRAMES = 50;
const TOTAL_DURATION = 5000;

const SPEED_UP_FACTOR = 1.2;
const SPLIT_INDEX = 36;

let animInterval = null;
let isAnimating = false;
let frameIntervals = [];

function buildFrameIntervals() {
  const baseInterval = TOTAL_DURATION / TOTAL_FRAMES;
  const fastInterval = baseInterval / SPEED_UP_FACTOR;

    const intervals = [];
  for (let i = 0; i < SPLIT_INDEX; i++) {
    intervals.push(fastInterval);
  }
  const elapsedFast = SPLIT_INDEX * fastInterval;
  const remaining = TOTAL_DURATION - elapsedFast;
  const slowCount = TOTAL_FRAMES - SPLIT_INDEX;
  const slowInterval = remaining / slowCount;
  for (let i = SPLIT_INDEX; i < TOTAL_FRAMES; i++) {
    intervals.push(slowInterval);
  }
  return intervals;
}

function getFramePosition(frameIndex) {
  if (frameIndex < 0 || frameIndex >= TOTAL_FRAMES) frameIndex = 0;
  const col = frameIndex % COLS;
  const row = Math.floor(frameIndex / COLS);
  const xOffset = -col * FRAME_WIDTH;
  const yOffset = -row * FRAME_HEIGHT;
  return `${xOffset}px ${yOffset}px`;
}

export function startEatAnimation(petEl, petState, reRender) {
  stopEatAnimation();

  frameIntervals = buildFrameIntervals();

  let currentStep = 0;
    isAnimating = true;

  petEl.style.backgroundSize = `${FRAME_WIDTH * COLS}px ${FRAME_HEIGHT * ROWS}px`;
  petEl.style.backgroundImage = "url('./assets/eat.png')";
  updateFrame(petEl, currentStep);

  function step() {
    currentStep++;
    if (currentStep >= TOTAL_FRAMES) {
            isAnimating = false;
      animInterval = null;

      petEl.style.backgroundImage = '';
      petState.setEmotion('idle');
      if (reRender) reRender();
      return;
    }
    updateFrame(petEl, currentStep);
    const delay = frameIntervals[currentStep] || frameIntervals[frameIntervals.length - 1];
    animInterval = setTimeout(step, delay);
  }

  const firstDelay = frameIntervals[0] || 0;
  animInterval = setTimeout(step, firstDelay);
}

export function stopEatAnimation() {
  if (animInterval) {
    clearTimeout(animInterval);
    animInterval = null;
  }
  isAnimating = false;
}

export function isEatAnimating() {
  return isAnimating;
}

function updateFrame(petEl, frameIndex) {
  petEl.style.backgroundPosition = getFramePosition(frameIndex);
}
