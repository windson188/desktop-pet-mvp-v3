const { contextBridge, ipcRenderer } = require("electron");
const fs = require("fs");
const path = require("path");
const os = require("os");

const DATA_DIR = path.join(os.homedir(), ".desktop-pet-v2");
const DATA_FILE = path.join(DATA_DIR, "app-state.json");

function ensureDataFile() {
if (!fs.existsSync(DATA_DIR)) {
fs.mkdirSync(DATA_DIR, { recursive: true });
}

if (!fs.existsSync(DATA_FILE)) {
const defaultState = {
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

fs.writeFileSync(DATA_FILE, JSON.stringify(defaultState, null, 2), "utf-8");
}
}

ensureDataFile();

contextBridge.exposeInMainWorld("desktopPetAPI", {
loadState() {
ensureDataFile();
const raw = fs.readFileSync(DATA_FILE, "utf-8");
return JSON.parse(raw);
},

saveState(state) {
ensureDataFile();
fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2), "utf-8");
return true;
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
  // 确保两个参数都是有效数字
  if (typeof x !== 'number' || isNaN(x) || typeof y !== 'number' || isNaN(y)) {
    console.warn('setWindowPosition: invalid arguments', x, y);
    return;
  }
  return ipcRenderer.invoke("window:setPosition", x, y);
}
});