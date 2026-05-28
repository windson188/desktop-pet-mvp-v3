const FRAME_WIDTH = 180;
const FRAME_HEIGHT = 180;

const ANIMATIONS = [
  {
    name: 'yoyo',
    sprite: "url('./assets/idle_yoyo.png')",
    cols: 5, rows: 5, totalFrames: 25,
    duration: 4000,
    lastFrameHold: 500,
    bubble: "这招叫'风火轮'，酷不酷？",
    repeatStart: 10, repeatEnd: 14, extraRepeats: 2
  },
  {
    name: 'stretch',
    sprite: "url('./assets/idle_stretch.png')",
    cols: 5, rows: 4, totalFrames: 20,
    duration: 3000,
    lastFrameHold: 500,
    bubble: '伸个懒腰，好舒服~'
  },
  {
    name: 'wag',
    sprite: "url('./assets/idle_wag.png')",
    cols: 5, rows: 4, totalFrames: 20,
    duration: 3000,
    lastFrameHold: 300,
    bubble: '摇摇尾巴，真开心！'
  },
  {
    name: 'blink',
    sprite: "url('./assets/idle_blink.png')",
    cols: 5, rows: 4, totalFrames: 20,
    duration: 1500,
    lastFrameHold: 200,
    bubble: ''
  }
];

let animTimeout = null;
let isAnimating = false;
let idleCheckTimer = null;
let currentAnim = null;

function buildFrameSequence(cfg) {
  if (!cfg.repeatStart) {
    const seq = [];
    for (let i = 0; i < cfg.totalFrames; i++) seq.push(i);
    return seq;
  }

  const seq = [];
  for (let i = 0; i < cfg.repeatStart; i++) seq.push(i);
  for (let r = 0; r < 1 + cfg.extraRepeats; r++) {
    for (let i = cfg.repeatStart; i <= cfg.repeatEnd; i++) seq.push(i);
  }
  for (let i = cfg.repeatEnd + 1; i < cfg.totalFrames; i++) seq.push(i);
  return seq;
}

function getFramePosition(frameIndex, cols) {
  if (frameIndex < 0) frameIndex = 0;
  const col = frameIndex % cols;
  const row = Math.floor(frameIndex / cols);
  return `${-col * FRAME_WIDTH}px ${-row * FRAME_HEIGHT}px`;
}

function updateFrame(petEl, frameIndex, cols) {
  petEl.style.backgroundPosition = getFramePosition(frameIndex, cols);
}

function startAnimation(petEl, petState, reRender, anim) {
  stopAnimation();
  currentAnim = anim;
  const seq = buildFrameSequence(anim);
  const stepCount = seq.length;
  const stepInterval = (anim.duration - anim.lastFrameHold) / (stepCount - 1);

  let currentStep = 0;
  isAnimating = true;

  petEl.style.backgroundSize = `${FRAME_WIDTH * anim.cols}px ${FRAME_HEIGHT * anim.rows}px`;
  petEl.style.backgroundImage = anim.sprite;
  updateFrame(petEl, seq[currentStep], anim.cols);

  function step() {
    currentStep++;
    if (currentStep >= stepCount) {
      isAnimating = false;
      animTimeout = null;
      currentAnim = null;

      petEl.style.backgroundImage = '';
      petEl.style.backgroundSize = '';
      petEl.style.backgroundPosition = '';

      petState.setBubble('');
      const bubble = document.getElementById('bubble');
      if (bubble) bubble.classList.add('hidden');

      petState.setEmotion('idle');
      if (reRender) reRender();

      scheduleNextIdleCheck(petEl, petState, reRender);
      return;
    }

    updateFrame(petEl, seq[currentStep], anim.cols);

    const delay = (currentStep === stepCount - 1) ? anim.lastFrameHold : stepInterval;
    animTimeout = setTimeout(step, delay);
  }

  animTimeout = setTimeout(step, stepInterval);
}

function stopAnimation() {
  if (animTimeout) {
    clearTimeout(animTimeout);
    animTimeout = null;
  }
  isAnimating = false;
  currentAnim = null;
}

export function startRandomIdleAnimation(petEl, petState, reRender) {
  stopAnimation();
  const idx = Math.floor(Math.random() * ANIMATIONS.length);
  startAnimation(petEl, petState, reRender, ANIMATIONS[idx]);
}

export function stopIdleAnimation() {
  stopAnimation();
}

export function stopIdleCheck() {
  if (idleCheckTimer) {
    clearTimeout(idleCheckTimer);
    idleCheckTimer = null;
  }
}

function scheduleNextIdleCheck(petEl, petState, reRender) {
  stopIdleCheck();

  const delay = Math.floor(Math.random() * (20000 - 8000 + 1) + 8000);
  idleCheckTimer = setTimeout(() => {
    idleCheckTimer = null;

    if (petState.getEmotion() === 'idle' && !isAnimating) {
      const idx = Math.floor(Math.random() * ANIMATIONS.length);
      const anim = ANIMATIONS[idx];
      petState.setEmotion('yoyo');
      if (anim.bubble) petState.setBubble(anim.bubble);
      if (reRender) reRender();
    }
  }, delay);
}

export function startIdleCheck(petEl, petState, reRender) {
  stopIdleCheck();
  scheduleNextIdleCheck(petEl, petState, reRender);
}

export function getIdleAnimName() {
  return currentAnim ? currentAnim.name : null;
}

export function isIdleAnimating() {
  return isAnimating;
}
