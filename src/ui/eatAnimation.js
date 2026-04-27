// src/ui/eatAnimation.js

const FRAME_WIDTH = 180;          // 单帧宽度（px）
const FRAME_HEIGHT = 180;         // 单帧高度（px）
const COLS = 10;                  // 列数
const ROWS = 5;                   // 行数
const TOTAL_FRAMES = 50;          // 总帧数（10列 × 5行）
const TOTAL_DURATION = 5000;      // 动画总时长（ms）

// 前半段加速倍率（数值越大越快），后半段自动补偿时间
const SPEED_UP_FACTOR = 1.2;
// 分界帧索引：前 36 帧加速，后 14 帧减速
const SPLIT_INDEX = 36;

let animInterval = null;
let isAnimating = false;
let frameIntervals = [];          // 每帧的间隔时间

/**
 * 构建帧间隔序列：
 * - 前半段（0 ~ SPLIT_INDEX-1）：加速，间隔 = 基准间隔 / SPEED_UP_FACTOR
 * - 后半段（SPLIT_INDEX ~ TOTAL_FRAMES-1）：减速补偿，使总时长为 TOTAL_DURATION
 */
function buildFrameIntervals() {
  const baseInterval = TOTAL_DURATION / TOTAL_FRAMES;
  const fastInterval = baseInterval / SPEED_UP_FACTOR;

  const intervals = [];
  // 前半段加速
  for (let i = 0; i < SPLIT_INDEX; i++) {
    intervals.push(fastInterval);
  }
  // 后半段：用剩余时间均分
  const elapsedFast = SPLIT_INDEX * fastInterval;
  const remaining = TOTAL_DURATION - elapsedFast;
  const slowCount = TOTAL_FRAMES - SPLIT_INDEX;
  const slowInterval = remaining / slowCount;
  for (let i = SPLIT_INDEX; i < TOTAL_FRAMES; i++) {
    intervals.push(slowInterval);
  }
  return intervals;
}

/**
 * 根据帧索引获取背景位置
 * 精灵图从左到右、从上到下排列
 */
function getFramePosition(frameIndex) {
  if (frameIndex < 0 || frameIndex >= TOTAL_FRAMES) frameIndex = 0;
  const col = frameIndex % COLS;
  const row = Math.floor(frameIndex / COLS);
  const xOffset = -col * FRAME_WIDTH;
  const yOffset = -row * FRAME_HEIGHT;
  return `${xOffset}px ${yOffset}px`;
}

export function startEatAnimation(petEl, petState, reRender) {
  // 强制停止任何正在运行的动画，重新开始
  stopEatAnimation();

  frameIntervals = buildFrameIntervals();

  let currentStep = 0;
  isAnimating = true;

  // 固定背景尺寸，使用完整的精灵图尺寸
  petEl.style.backgroundSize = `${FRAME_WIDTH * COLS}px ${FRAME_HEIGHT * ROWS}px`;
  petEl.style.backgroundImage = "url('./assets/eat.png')";
  updateFrame(petEl, currentStep);

  function step() {
    currentStep++;
    if (currentStep >= TOTAL_FRAMES) {
      isAnimating = false;
      animInterval = null;

      // 恢复 idle 并重绘
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
