
const FRAME_WIDTH = 180;
const FRAME_COUNT = 16;
const TOTAL_DURATION = 2000;

const REPEAT_START = 4;
const REPEAT_END = 7;
const EXTRA_REPEATS = 2;

let animInterval = null;
let isAnimating = false;

function buildFrameSequence() {
  const seq = [];
  for (let i = 0; i < REPEAT_START; i++) seq.push(i);
  for (let r = 0; r < 1 + EXTRA_REPEATS; r++) {
    for (let i = REPEAT_START; i <= REPEAT_END; i++) seq.push(i);
  }
  for (let i = REPEAT_END + 1; i < FRAME_COUNT; i++) seq.push(i);
  return seq;
}

export function startClapAnimation(petEl, petState, reRender) {
  stopClapAnimation();

  const sequence = buildFrameSequence();
  const stepCount = sequence.length;
  const stepInterval = TOTAL_DURATION / stepCount;

  let currentStep = 0;
    isAnimating = true;

  petEl.style.backgroundSize = 'auto 180px';
  updateFrame(petEl, sequence[currentStep]);

  animInterval = setInterval(() => {
    currentStep++;
    if (currentStep >= stepCount) {
      clearInterval(animInterval);
      animInterval = null;
            isAnimating = false;

      petState.setEmotion('idle');
      if (reRender) reRender();
      return;
    }
    updateFrame(petEl, sequence[currentStep]);
  }, stepInterval);
}

export function stopClapAnimation() {
  if (animInterval) {
    clearInterval(animInterval);
    animInterval = null;
  }
  isAnimating = false;
}

function updateFrame(petEl, frameIndex) {
  const xOffset = -frameIndex * FRAME_WIDTH;
  petEl.style.backgroundPosition = `${xOffset}px 0`;
}