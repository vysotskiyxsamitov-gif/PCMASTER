// Собирает three.bundle.js из node_modules/three (новая версия + аддоны постобработки) рядом с index.html,
// чтобы игра работала без интернета и обычными <script>, без модулей.
const fs = require('fs'), path = require('path');
const entry = path.join(__dirname, 'three-entry.js');
const out = path.join(__dirname, 'three.bundle.js');
if (!fs.existsSync(path.join(__dirname, 'node_modules', 'three'))) {
  console.error('node_modules/three не найден — выполните npm install');
  process.exit(1);
}
require('esbuild').buildSync({
  entryPoints: [entry], bundle: true, minify: true, format: 'iife',
  target: 'chrome120', legalComments: 'none', outfile: out
});
console.log('three.bundle.js собран (' + Math.round(fs.statSync(out).size / 1024) + ' КБ)');
