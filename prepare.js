// Копирует three.js из npm-пакета рядом с игрой и меняет ссылку на CDN на локальный файл,
// чтобы .exe работал без интернета.
const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, 'node_modules', 'three', 'build', 'three.min.js');
const dst = path.join(__dirname, 'three.min.js');
fs.copyFileSync(src, dst);

const htmlPath = path.join(__dirname, 'index.html');
let html = fs.readFileSync(htmlPath, 'utf8');
const re = /<script src="https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/three\.js\/r128\/three\.min\.js"><\/script>/;
if (re.test(html)) {
  html = html.replace(re, '<script src="three.min.js"></script>');
  fs.writeFileSync(htmlPath, html);
  console.log('three.js подключён локально');
} else {
  console.log('Ссылка на CDN не найдена — пропускаю замену');
}
