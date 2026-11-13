const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');
let autoUpdater = null;
try { autoUpdater = require('electron-updater').autoUpdater; } catch (e) { /* без обновлений (запуск из исходников) */ }
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

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

  mainWin = win;
  win.loadFile(path.join(__dirname, 'index.html'));
}

// Игра просит вернуть захват мыши после паузы: выполняем запрос «как от клика», браузер разрешает его без реального нажатия.
ipcMain.on('pc-relock', (event) => {
  try { event.sender.executeJavaScript('window.__relock && window.__relock()', true); } catch (e) {}
});

/* ---------- обновления: проверяем файл latest.yml на твоём сайте (адрес в package.json → build.publish.url) ---------- */
let mainWin = null;
function sendUpd(o) { try { if (mainWin && !mainWin.isDestroyed()) mainWin.webContents.send('pc-update', o); } catch (e) {} }
function setupUpdater() {
  if (!autoUpdater || !app.isPackaged) return;
  autoUpdater.autoDownload = false;            // сначала спрашиваем игрока
  autoUpdater.autoInstallOnAppQuit = true;     // если скачал и просто закрыл игру — поставится при выходе
  autoUpdater.on('update-available', (i) => sendUpd({ state: 'available', version: i && i.version }));
  autoUpdater.on('download-progress', (p) => sendUpd({ state: 'progress', percent: Math.round(p.percent || 0) }));
  autoUpdater.on('update-downloaded', (i) => sendUpd({ state: 'ready', version: i && i.version }));
  autoUpdater.on('error', (e) => sendUpd({ state: 'error', msg: String(e && e.message || e).slice(0, 160) }));
  const check = () => { try { autoUpdater.checkForUpdates().catch(() => {}); } catch (e) {} };
  setTimeout(check, 8000); setInterval(check, 30 * 60 * 1000);
}
ipcMain.on('pc-update-download', () => { try { autoUpdater && autoUpdater.downloadUpdate().catch(() => {}); } catch (e) {} });
ipcMain.on('pc-update-install', () => { try { autoUpdater && autoUpdater.quitAndInstall(false, true); } catch (e) {} });
ipcMain.handle('pc-version', () => app.getVersion());

app.whenReady().then(() => {
  createWindow(); setupUpdater();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  app.quit();
});
