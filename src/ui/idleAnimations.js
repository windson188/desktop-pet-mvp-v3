import { stopBubbleCycle } from './bubbleController.js';

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
    bubble: '伸个懒腰，好舒服~',
    slowRange: { start: 8, end: 14, multiplier: 1.3 }
  },
  {
    name: 'wag',
    sprite: "url('./assets/idle_wag.png')",
    cols: 5, rows: 4, totalFrames: 20,
    duration: 2400,
    lastFrameHold: 240,
    bubble: '摇摇尾巴，真开心！'
  },
  {
    name: 'blink',
    sprite: "url('./assets/sprite_blink.png')",
    cols: 6, rows: 1, totalFrames: 6,
    duration: 800,
    lastFrameHold: 80,
    bubble: '',
    pingPong: true
  },
  {
    name: 'blink_quick',
    sprite: "url('./assets/sprite_blink.png')",
    cols: 6, rows: 1, totalFrames: 6,
    duration: 800,
    lastFrameHold: 80,
    bubble: '',
    pingPong: true
  },
  {
    name: 'blink_quick',
    sprite: "url('./assets/sprite_blink.png')",
    cols: 6, rows: 1, totalFrames: 6,
    duration: 800,
    lastFrameHold: 80,
    bubble: '',
    pingPong: true
  },
  {
    name: 'blink_quick',
    sprite: "url('./assets/sprite_blink.png')",
    cols: 6, rows: 1, totalFrames: 6,
    duration: 800,
    lastFrameHold: 80,
    bubble: '',
    pingPong: true
  },
  {
    name: 'blink_quick',
    sprite: "url('./assets/sprite_blink.png')",
    cols: 6, rows: 1, totalFrames: 6,
    duration: 800,
    lastFrameHold: 80,
    bubble: '',
    pingPong: true
  },
  {
    name: 'blink_quick',
    sprite: "url('./assets/sprite_blink.png')",
    cols: 6, rows: 1, totalFrames: 6,
    duration: 800,
    lastFrameHold: 80,
    bubble: '',
    pingPong: true
  },
  {
    name: 'blink_quick',
    sprite: "url('./assets/sprite_blink.png')",
    cols: 6, rows: 1, totalFrames: 6,
    duration: 800,
    lastFrameHold: 80,
    bubble: '',
    pingPong: true
  }
];

let animTimeout = null;
let isAnimating = false;
let idleCheckTimer = null;
let currentAnim = null;
let pendingAnimIndex = 0;

function buildFrameSequence(cfg) {
  let seq;

  if (cfg.frameRange) {
    seq = [];
    for (let i = cfg.frameRange.start; i <= cfg.frameRange.end; i++) seq.push(i);
  } else if (!cfg.repeatStart) {
    seq = [];
    for (let i = 0; i < cfg.totalFrames; i++) seq.push(i);
  } else {
    seq = [];
    for (let i = 0; i < cfg.repeatStart; i++) seq.push(i);
    for (let r = 0; r < 1 + cfg.extraRepeats; r++) {
      for (let i = cfg.repeatStart; i <= cfg.repeatEnd; i++) seq.push(i);
    }
    for (let i = cfg.repeatEnd + 1; i < cfg.totalFrames; i++) seq.push(i);
  }

  if (cfg.pingPong) {
    for (let i = seq.length - 2; i >= 0; i--) {
      seq.push(seq[i]);
    }
  }

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
  stopBubbleCycle();
  currentAnim = anim;
  const seq = buildFrameSequence(anim);
  const stepCount = seq.length;
  const stepInterval = (anim.duration - anim.lastFrameHold) / (stepCount - 1);

  let currentStep = 0;
  isAnimating = true;

  // 直接设置 DOM 气泡文字，绕过 petState，避免竞态
  const bubbleEl = document.getElementById('bubble');
  if (bubbleEl) {
    if (anim.bubble) {
      bubbleEl.textContent = anim.bubble;
    } else {
      bubbleEl.classList.add('hidden');
    }
  }

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

    const frameIndex = seq[currentStep];
    updateFrame(petEl, frameIndex, anim.cols);

    let delay;
    if (currentStep === stepCount - 1) {
      delay = anim.lastFrameHold;
    } else {
      delay = stepInterval;
      if (anim.slowRange && frameIndex >= anim.slowRange.start && frameIndex <= anim.slowRange.end) {
        delay *= anim.slowRange.multiplier;
      }
    }
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

export function startIdleAnimation(petEl, petState, reRender) {
  stopAnimation();
  startAnimation(petEl, petState, reRender, ANIMATIONS[pendingAnimIndex]);
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
      pendingAnimIndex = Math.floor(Math.random() * ANIMATIONS.length);
      const anim = ANIMATIONS[pendingAnimIndex];
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

export function getPendingBubble() {
  return ANIMATIONS[pendingAnimIndex].bubble;
}

export function isIdleAnimating() {
  return isAnimating;
}
