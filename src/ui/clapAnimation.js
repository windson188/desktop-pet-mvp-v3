// src/ui/clapAnimation.js

const FRAME_WIDTH = 180;          // 单帧宽度（px）
const FRAME_COUNT = 16;           // 总帧数
const TOTAL_DURATION = 2000;      // 动画总时长（ms）

// 帧序列：第4~7帧额外重复2次（共3次）
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
  // 强制停止任何正在运行的动画，重新开始
  stopClapAnimation();

  const sequence = buildFrameSequence();
  const stepCount = sequence.length;
  const stepInterval = TOTAL_DURATION / stepCount;

  let currentStep = 0;
  isAnimating = true;

  // 固定背景尺寸，避免被基类 contain 干扰
  petEl.style.backgroundSize = 'auto 180px';
  updateFrame(petEl, sequence[currentStep]);

  animInterval = setInterval(() => {
    currentStep++;
    if (currentStep >= stepCount) {
      clearInterval(animInterval);
      animInterval = null;
      isAnimating = false;

      // 恢复 idle 并重绘
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