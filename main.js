const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 720,
    fullscreen: true,
    backgroundColor: '#05060a',
    autoHideMenuBar: true,
    title: 'PC МАСТЕР',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  Menu.setApplicationMenu(null);

  // F11 — выйти из полного экрана / вернуться в него
  win.webContents.on('before-input-event', (event, input) => {
    if (input.type === 'keyDown' && input.key === 'F11') {
      win.setFullScreen(!win.isFullScreen());
      event.preventDefault();
    }
  });

  win.loadFile(path.join(__dirname, 'index.html'));
}

// Игра просит вернуть захват мыши после паузы: выполняем запрос «как от клика», браузер разрешает его без реального нажатия.
ipcMain.on('pc-relock', (event) => {
  try { event.sender.executeJavaScript('window.__relock && window.__relock()', true); } catch (e) {}
});

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  app.quit();
});
