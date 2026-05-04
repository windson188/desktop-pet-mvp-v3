// src/ui/yoyoAnimation.js
// idle_yoyo 动画
// 精灵图：900x900px，5列x5行=25帧
// 帧0-24，第10~14帧重复播放两次（即共3次），最后一帧（第24帧）保持0.5秒
// 总时长4000ms

const FRAME_WIDTH = 180;          // 900/5 = 180px 每帧宽
const FRAME_HEIGHT = 180;         // 900/5 = 180px 每帧高
const COLS = 5;                   // 列数
const ROWS = 5;                   // 行数
const TOTAL_FRAMES = 25;          // 总帧数
const TOTAL_DURATION = 4000;      // 动画总时长（ms）

// 需要重复的帧范围（第10~14帧，索引从0开始）
const REPEAT_START = 10;
const REPEAT_END = 14;
const EXTRA_REPEATS = 2;          // 额外重复2次，即这5帧共出现3次

// 最后一帧保持时长（ms）
const LAST_FRAME_HOLD = 500;

let animTimeout = null;
let isAnimating = false;
let idleCheckTimer = null;        // 用于闲置时随机触发

/**
 * 构建帧序列：
 * - 第0~9帧：正常播放
 * - 第10~14帧：重复播放（EXTRA_REPEATS + 1）次
 * - 第15~23帧：正常播放
 * - 第24帧：正常播放（之后会保持 LAST_FRAME_HOLD 时长）
 */
function buildFrameSequence() {
  const seq = [];
  // 第0~9帧
  for (let i = 0; i < REPEAT_START; i++) seq.push(i);
  // 第10~14帧重复（原1次 + 额外EXTRA_REPEATS次）
  for (let r = 0; r < 1 + EXTRA_REPEATS; r++) {
    for (let i = REPEAT_START; i <= REPEAT_END; i++) seq.push(i);
  }
  // 第15~24帧
  for (let i = REPEAT_END + 1; i < TOTAL_FRAMES; i++) seq.push(i);
  return seq;
}

const FRAME_SEQUENCE = buildFrameSequence();
const STEP_COUNT = FRAME_SEQUENCE.length;
// 除最后一帧（第24帧）保持 LAST_FRAME_HOLD 外，其余步均分剩余时长
const STEP_INTERVAL = (TOTAL_DURATION - LAST_FRAME_HOLD) / (STEP_COUNT - 1);

/**
 * 根据帧索引获取精灵图的background-position
 * 精灵图从左到右、从上到下排列（5列x5行）
 */
function getFramePosition(frameIndex) {
  if (frameIndex < 0 || frameIndex >= TOTAL_FRAMES) frameIndex = 0;
  const col = frameIndex % COLS;
  const row = Math.floor(frameIndex / COLS);
  const xOffset = -col * FRAME_WIDTH;
  const yOffset = -row * FRAME_HEIGHT;
  return `${xOffset}px ${yOffset}px`;
}

function updateFrame(petEl, frameIndex) {
  petEl.style.backgroundPosition = getFramePosition(frameIndex);
}

/**
 * 启动 yoyo 动画
 */
export function startYoyoAnimation(petEl, petState, reRender) {
  stopYoyoAnimation(); // 强制停止任何正在运行的 yoyo 动画

  let currentStep = 0;
  isAnimating = true;

  // 设置精灵图样式
  petEl.style.backgroundSize = `${FRAME_WIDTH * COLS}px ${FRAME_HEIGHT * ROWS}px`; // 900px 900px
  petEl.style.backgroundImage = "url('./assets/idle_yoyo.png')";
  updateFrame(petEl, FRAME_SEQUENCE[currentStep]);

  function step() {
    currentStep++;
    if (currentStep >= STEP_COUNT) {
      // 动画全部播放完毕，最后一帧已保持了LAST_FRAME_HOLD时长
      isAnimating = false;
      animTimeout = null;

      // 清除背景样式，回到CSS控制
      petEl.style.backgroundImage = '';
      petEl.style.backgroundSize = '';
      petEl.style.backgroundPosition = '';

      // 清除“风火轮”气泡文字并隐藏气泡
      petState.setBubble('');
      const bubble = document.getElementById("bubble");
      if (bubble) bubble.classList.add("hidden");

      // 恢复为 idle 状态
      petState.setEmotion('idle');
      if (reRender) reRender();

      // 动画结束后，延迟一段时间再启动新一轮的闲置检测
      scheduleNextIdleCheck(petEl, petState, reRender);
      return;
    }

    updateFrame(petEl, FRAME_SEQUENCE[currentStep]);

    // 如果是最后一帧（第24帧），保持 LAST_FRAME_HOLD 时长
    const delay = (currentStep === STEP_COUNT - 1) ? LAST_FRAME_HOLD : STEP_INTERVAL;
    animTimeout = setTimeout(step, delay);
  }

  animTimeout = setTimeout(step, STEP_INTERVAL);
}

/**
 * 停止 yoyo 动画
 */
export function stopYoyoAnimation() {
  if (animTimeout) {
    clearTimeout(animTimeout);
    animTimeout = null;
  }
  isAnimating = false;
}

/**
 * 停止闲置轮播检测
 */
export function stopIdleCheck() {
  if (idleCheckTimer) {
    clearTimeout(idleCheckTimer);
    idleCheckTimer = null;
  }
}

/**
 * 安排下一次闲置动画触发
 * 在闲置状态下随机触发 yoyo 动画
 */
function scheduleNextIdleCheck(petEl, petState, reRender) {
  stopIdleCheck();

  // 随机延迟 8~20 秒后检测是否适合播放 yoyo 动画
  const delay = Math.floor(Math.random() * (20000 - 8000 + 1) + 8000);
  idleCheckTimer = setTimeout(() => {
    idleCheckTimer = null;

    // 只有处于 idle 状态且当前没有其他动画进行时才触发
    if (petState.getEmotion() === 'idle' && !isAnimating) {
      petState.setEmotion('yoyo');
      // 设置气泡内容（renderPet 会同步渲染气泡文本）
      petState.setBubble("这招叫'风火轮'，酷不酷？");
      if (reRender) reRender();

      // 注意：此时 emotion 已设为 'yoyo'，renderPet 会在渲染时调用 startYoyoAnimation，
      // 而 startYoyoAnimation 完成后会清除气泡文字并隐藏气泡
    }
  }, delay);
}

/**
 * 启动 idle 状态下的 yoyo 轮播检测
 * 在宠物进入 idle 状态时调用
 */
export function startIdleYoyoCheck(petEl, petState, reRender) {
  stopIdleCheck();
  scheduleNextIdleCheck(petEl, petState, reRender);
}

export function isYoyoAnimating() {
  return isAnimating;
}


