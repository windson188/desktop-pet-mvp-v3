export function createPetState(initialPet) {
  let state = {
    mood: initialPet?.mood ?? 100,
    energy: initialPet?.energy ?? 90,
    bond: initialPet?.bond ?? 6,
    lastInteractAt: initialPet?.lastInteractAt || Date.now(),
    bubble: "戳我一下试试？",
    emotion: initialPet?.emotion ?? 'idle'
  };

  let decayIntervals = [];

  const randomLines = [
    "今天也要努力呀",
    "摸摸我，我会开心一点",
    "别忘了今天的任务",
    "我在盯着你的待办呢",
    "有我陪着你，不慌"
  ];

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function updateBubbleByStatus() {
    if (state.energy < 20) {
      state.bubble = "好累啊，快喂我吃点东西吧～";
    } else if (state.mood < 20) {
      state.bubble = "心情不太好，摸摸我可以让我开心一点。";
    } else {
      if (state.bubble === "好累啊，快喂我吃点东西吧～" || state.bubble === "心情不太好，摸摸我可以让我开心一点。") {
        state.bubble = "嗯，现在舒服多了！";
      }
    }
  }

  function decreaseEnergy(amount = 1) {
    state.energy = clamp(state.energy - amount, 0, 100);
    updateBubbleByStatus();
    console.log(`精力-${amount}，当前精力: ${state.energy}`);
  }

  function increaseEnergy(amount = 2) {
    state.energy = clamp(state.energy + amount, 0, 100);
    if (state.energy >= 20 && state.bubble === "好累啊，快喂我吃点东西吧～") {
      state.bubble = "吃饱了，又有力气啦！";
    }
    console.log(`精力+${amount}，当前精力: ${state.energy}`);
  }

  function decreaseMood(amount = 1) {
    state.mood = clamp(state.mood - amount, 0, 100);
    updateBubbleByStatus();
    console.log(`心情-${amount}，当前心情: ${state.mood}`);
  }

  function increaseMood(amount = 2) {
    state.mood = clamp(state.mood + amount, 0, 100);
    if (state.mood >= 20 && state.bubble === "心情不太好，摸摸我可以让我开心一点。") {
      state.bubble = "心情变好了，谢谢你！";
    }
    console.log(`心情+${amount}，当前心情: ${state.mood}`);
  }

  function increaseBond(amount = 1) {
    state.bond = clamp(state.bond + amount, 0, 999);
    console.log(`亲密度+${amount}，当前亲密度: ${state.bond}`);
  }

  function startDecayTimer() {
    stopDecayTimer();
    decayIntervals.push(setInterval(() => {
      decreaseEnergy(1);
    }, 3600000));
    decayIntervals.push(setInterval(() => {
      decreaseMood(1);
    }, 7200000));
  }

  function stopDecayTimer() {
    decayIntervals.forEach((intervalId) => clearInterval(intervalId));
    decayIntervals = [];
  }

  function applyReminderEffect() {
    decreaseEnergy(1);
    increaseBond(1);
    state.lastInteractAt = Date.now();
    console.log(`提醒触发：精力-1，亲密度+1`);
  }

  function setEmotion(emo) {
    const valid = ['idle', 'happy', 'clap', 'eat', 'yoyo'];
    if (valid.includes(emo)) {
      state.emotion = emo;
    }
  }

  function getEmotion() {
    return state.emotion;
  }

  return {
    getState() {
      return {
        mood: state.mood,
        energy: state.energy,
        bond: state.bond,
        lastInteractAt: state.lastInteractAt,
        emotion: state.emotion
      };
    },
    getBubble() {
      return state.bubble;
    },
    setBubble(text) {
      state.bubble = text;
    },
    sayRandom() {
      state.bubble = randomLines[Math.floor(Math.random() * randomLines.length)];
      state.lastInteractAt = Date.now();
    },
    feed() {
      increaseEnergy(2);
      state.lastInteractAt = Date.now();
      state.bubble = "好耶，吃到东西啦！";
    },
    pet() {
      increaseMood(2);
      increaseBond(1);
      state.lastInteractAt = Date.now();
      state.bubble = "嘿嘿，被摸摸了";
    },
    completeReminderEffect(reminderText) {
      decreaseEnergy(1);
      increaseBond(1);
      state.lastInteractAt = Date.now();
      state.bubble = `主人，你真棒，又完成${reminderText}了哦！`;
      console.log(`完成提醒：${reminderText}，精力-1，亲密度+1`);
    },
    applyReminderEffect,
    addClickBond() {
      increaseBond(1);
      state.bubble = "被你点了好多下，好开心！";
    },
    getMood() {
      return state.mood;
    },
    getEnergy() {
      return state.energy;
    },
    getBond() {
      return state.bond;
    },
    startDecayTimer,
    stopDecayTimer,
    getRandomLine() {
      return randomLines[Math.floor(Math.random() * randomLines.length)];
    },
    setEmotion,
    getEmotion
  };
}