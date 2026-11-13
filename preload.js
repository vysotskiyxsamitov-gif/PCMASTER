// Мостик между игрой и приложением: даёт игре попросить вернуть захват мыши без клика.
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('pcApp', {
  relock: () => ipcRenderer.send('pc-relock'),
  version: () => ipcRenderer.invoke('pc-version'),
  onUpdate: (cb) => ipcRenderer.on('pc-update', (_e, o) => cb(o)),
  downloadUpdate: () => ipcRenderer.send('pc-update-download'),
  installUpdate: () => ipcRenderer.send('pc-update-install')
});
