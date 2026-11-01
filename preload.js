// Мостик между игрой и приложением: даёт игре попросить вернуть захват мыши без клика.
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('pcApp', {
  relock: () => ipcRenderer.send('pc-relock')
});
