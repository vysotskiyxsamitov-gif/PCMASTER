// Копирует three.min.js из node_modules рядом с index.html, чтобы игра работала без интернета.
const fs = require('fs'), path = require('path');
const src = path.join(__dirname, 'node_modules', 'three', 'build', 'three.min.js');
const dst = path.join(__dirname, 'three.min.js');
if (fs.existsSync(src)) { fs.copyFileSync(src, dst); console.log('three.min.js скопирован'); }
else console.warn('node_modules/three не найден — выполните npm install (игра возьмёт three.js из интернета)');
