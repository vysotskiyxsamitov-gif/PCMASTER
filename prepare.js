{
  "name": "pc-master",
  "version": "1.0.0",
  "description": "PC МАСТЕР — симулятор сборки ПК",
  "main": "main.js",
  "author": "PC Master",
  "scripts": {
    "start": "node prepare.js && electron .",
    "dist": "node prepare.js && electron-builder --win --publish never"
  },
  "devDependencies": {
    "electron": "^33.0.0",
    "electron-builder": "^25.1.8",
    "three": "0.128.0"
  },
  "build": {
    "appId": "com.pcmaster.game",
    "productName": "PC MASTER",
    "files": [
      "main.js",
      "index.html",
      "audio.js",
      "pause.js",
      "intro.js",
      "extras.js",
      "three.min.js"
    ],
    "win": {
      "target": "portable"
    },
    "portable": {
      "artifactName": "PC-MASTER.exe"
    }
  }
}
