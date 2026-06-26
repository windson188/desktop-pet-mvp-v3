const { app, BrowserWindow, ipcMain, screen, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
const os = require("os");

app.disableHardwareAcceleration();

let mainWindow = null;

const BASE_HEIGHT = 250;
const MIN_WIDTH = 280;
const MIN_HEIGHT = 180;
const MAX_HEIGHT = 880;
const FIXED_WIDTH = 320;

const DATA_DIR = path.join(__dirname, "user_data");
const DATA_FILE = path.join(DATA_DIR, "app-state.json");

function readSavedWindowBounds() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, "utf-8");
      const state = JSON.parse(raw);
      if (state.window) {
        const { x, y, height } = state.window;
        return {
          x: typeof x === "number" ? x : null,
          y: typeof y === "number" ? y : null,
          width: FIXED_WIDTH,
          height: typeof height === "number" ? height : BASE_HEIGHT,
        };
      }
    }
  } catch (err) {
    console.error("读取窗口状态失败:", err);
  }
  return { x: null, y: null, width: FIXED_WIDTH, height: BASE_HEIGHT };
}

function saveWindowBounds(bounds) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    let state = {};
    if (fs.existsSync(DATA_FILE)) {
      state = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
    }
    state.window = {
      ...(state.window || {}),
      x: bounds.x,
      y: bounds.y,
      width: FIXED_WIDTH,
      height: bounds.height,
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2), "utf-8");
  } catch (err) {
    console.error("保存窗口状态失败:", err);
  }
}

function debounce(fn, delay) {
  let timer = null;
  return (...args) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

function createWindow() {
  const savedBounds = readSavedWindowBounds();
  const display = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = display.workAreaSize;

  let x = savedBounds.x;
  let y = savedBounds.y;

  if (
    x === null ||
    y === null ||
    x + savedBounds.width < 0 ||
    x > screenWidth ||
    y + savedBounds.height < 0 ||
    y > screenHeight
  ) {
    x = screenWidth - FIXED_WIDTH - 40;
    y = screenHeight - savedBounds.height - 80;
  }

  mainWindow = new BrowserWindow({
    width: FIXED_WIDTH,
    height: savedBounds.height,
    x: x,
    y: y,
    transparent: true,
    frame: false,
    resizable: false,
    alwaysOnTop: true,
    hasShadow: false,
    skipTaskbar: false,
    minWidth: MIN_WIDTH,
    minHeight: MIN_HEIGHT,
    thickFrame: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, "src/index.html"));

  const debouncedSave = debounce((bounds) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      saveWindowBounds(bounds);
    }
  }, 200);

  mainWindow.on("move", () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      const bounds = mainWindow.getBounds();
      if (bounds.width !== FIXED_WIDTH) {
        mainWindow.setBounds({
          x: bounds.x,
          y: bounds.y,
          width: FIXED_WIDTH,
          height: bounds.height
        });
      }
      debouncedSave({ ...bounds, width: FIXED_WIDTH });
    }
  });
}

app.whenReady().then(() => {
  createWindow();

  ipcMain.handle("window:resizeTo", (_, newHeight) => {
    if (!mainWindow) return;
    const parsed = Number(newHeight);
    if (isNaN(parsed)) return;
    const safeHeight = Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, Math.round(parsed)));
    const [currentWidth, currentHeight] = mainWindow.getSize();
    const [currentX, currentY] = mainWindow.getPosition();
    const diff = safeHeight - currentHeight;
    let newY = currentY - diff;
    const display = screen.getDisplayMatching(mainWindow.getBounds());
    const { y: screenTop } = display.workArea;
    if (newY < screenTop) {
      newY = screenTop;
    }
    mainWindow.setBounds({
      x: currentX,
      y: newY,
      width: FIXED_WIDTH,
      height: safeHeight,
    });
  });

  ipcMain.handle("window:getBaseHeight", () => BASE_HEIGHT);
  ipcMain.handle("window:getPosition", () => {
    if (!mainWindow) return { x: 0, y: 0 };
    const [x, y] = mainWindow.getPosition();
    return { x, y };
  });

  ipcMain.handle("window:setPosition", (_, x, y) => {
    if (!mainWindow) return;
    const numX = Number(x);
    const numY = Number(y);
    if (isNaN(numX) || isNaN(numY)) return;
    mainWindow.setPosition(Math.round(numX), Math.round(numY));
  });

  ipcMain.handle("dialog:saveFile", async (_, { defaultName, content }) => {
    if (!mainWindow) return { success: false };
    const result = await dialog.showSaveDialog(mainWindow, {
      defaultPath: defaultName,
      filters: [{ name: "CSV 文件", extensions: ["csv"] }]
    });
    if (result.canceled || !result.filePath) return { success: false };
    try {
      fs.writeFileSync(result.filePath, content, "utf-8");
      return { success: true };
    } catch (err) {
      console.error("保存文件失败:", err);
      return { success: false };
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});