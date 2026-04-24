const { contextBridge, ipcRenderer } = require("electron");
const fs = require("fs");
const path = require("path");
const os = require("os");

const DATA_DIR = path.join(os.homedir(), ".desktop-pet-v2");
const DATA_FILE = path.join(DATA_DIR, "app-state.json");

function getDefaultState() {
  return {
    pet: {
      mood: "开心",
      energy: 90,
      bond: 6,
      lastInteractAt: Date.now()
    },
    todos: [],
    reminders: [],
    ui: {
      isAwake: false,
      activeInput: null
    },
    window: {
      x: null,
      y: null
    }
  };
}

function ensureDataFile() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify(getDefaultState(), null, 2), "utf-8");
    }
  } catch (err) {
    console.error("无法创建数据目录/文件:", err);
  }
}

ensureDataFile();

contextBridge.exposeInMainWorld("desktopPetAPI", {
  loadState() {
    try {
      ensureDataFile();
      const raw = fs.readFileSync(DATA_FILE, "utf-8");
      return JSON.parse(raw);
    } catch (err) {
      console.error("读取状态失败，使用默认状态:", err);
      return getDefaultState();
    }
  },

  saveState(state) {
    try {
      ensureDataFile();
      fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2), "utf-8");
      return true;
    } catch (err) {
      console.error("保存状态失败:", err);
      return false;
    }
  },

  resizeWindow(height) {
    return ipcRenderer.invoke("window:resizeTo", height);
  },

  getBaseHeight() {
    return ipcRenderer.invoke("window:getBaseHeight");
  },

  getWindowPosition() {
    return ipcRenderer.invoke("window:getPosition");
  },

  setWindowPosition(x, y) {
    if (typeof x !== 'number' || isNaN(x) || typeof y !== 'number' || isNaN(y)) {
      console.warn('setWindowPosition: invalid arguments', x, y);
      return;
    }
    return ipcRenderer.invoke("window:setPosition", x, y);
  }
});