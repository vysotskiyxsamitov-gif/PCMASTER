/* PC МАСТЕР — меню паузы (Esc).
   Исправлен возврат Pointer Lock после паузы.
*/

var PZ = 0;
var pzWas = false;

function pzBtn(label, js) {
  return '<button class="b" onclick="' + js + '">' + label + '</button>';
}

function pauseDraw() {
  try { optSave(); } catch (e) {}

  var o = $('pz');

  if (!o) {
    o = document.createElement('div');
    o.id = 'pz';

    o.style.cssText =
      'position:fixed;inset:0;z-index:20;' +
      'display:flex;align-items:center;justify-content:center;' +
      'background:rgba(5,6,10,.74);' +
      'backdrop-filter:blur(8px);' +
      '-webkit-backdrop-filter:blur(8px);' +
      'pointer-events:auto';

    $('w').appendChild(o);
  }

  o.style.display = 'flex';

  var MS = [.5, .75, 1, 1.5, 2];
  var mi = MS.indexOf(opt.ms || 1);

  o.innerHTML =
    '<div class="g" style="width:min(380px,86%);' +
    'display:flex;flex-direction:column;gap:9px;padding:18px">' +

    '<h1 style="margin:0 0 6px;text-align:center;' +
    'font-size:34px;letter-spacing:.08em;' +
    'background:linear-gradient(90deg,#6ee7ff,#c084fc,#f472b6);' +
    '-webkit-background-clip:text;background-clip:text;' +
    'color:transparent">ПАУЗА</h1>' +

    '<button class="b pr" onclick="pauseClose()">Продолжить</button>' +

    pzBtn(
      'Звуки: ' + (opt.s ? 'вкл' : 'выкл'),
      'opt.s=!opt.s;pauseDraw()'
    ) +

    pzBtn(
      'Громкость: ' + Math.round((window.__vol || 1) * 100) + '%',
      'audioVol({25:.5,50:.75,75:1,100:.25}[Math.round((window.__vol||1)*100)]||1);opt.s=1;pauseDraw()'
    ) +

    pzBtn(
      '🔊 Проверить звук',
      'opt.s=1;sfx(\'buy\');setTimeout(function(){sfx(\'place\')},350);setTimeout(function(){sfx(\'door\')},750)'
    ) +

    pzBtn(
      'Озвучка героя: ' + (opt.v ? 'вкл' : 'выкл'),
      'opt.v=!opt.v;pauseDraw()'
    ) +

    pzBtn(
      'Чувствительность мыши: ×' + (opt.ms || 1),
      'opt.ms=[.5,.75,1,1.5,2][' + ((mi + 1) % 5) + '];pauseDraw()'
    ) +

    pzBtn(
      'Инверсия Y: ' + (opt.inv ? 'вкл' : 'выкл'),
      'opt.inv=!opt.inv;pauseDraw()'
    ) +

    pzBtn(
      'Плавная камера: ' + (opt.sm ? 'вкл' : 'выкл'),
      'opt.sm=opt.sm?0:1;pauseDraw()'
    ) +

    pzBtn(
      'Реализм (тени, отражения): ' + (window.__rz ? window.__rz.name() : 'нет'),
      'window.__rz&&window.__rz.cycle();pauseDraw()'
    ) +

    pzBtn(
      'Графика: ' + (opt.q ? 'высокая' : 'экономная'),
      'opt.q=!opt.q;rs();pauseDraw()'
    ) +

    pzBtn(
      'Разводы при повороте: ' + (opt.mb === 0 ? 'выкл' : 'вкл'),
      'opt.mb=opt.mb===0?1:0;pauseDraw()'
    ) +

    pzBtn(
      'Свечение неона: ' + (opt.bl === 0 ? 'выкл' : 'вкл'),
      'opt.bl=opt.bl===0?1:0;pauseDraw()'
    ) +

    pzBtn(
      'Ультра-отражения (ultra.js): ' + (opt.ul === 0 ? 'выкл' : 'вкл'),
      'opt.ul=opt.ul===0?1:0;pauseDraw()'
    ) +

    pzBtn(
      'Сохранить и выйти в меню',
      'pauseToMenu()'
    ) +

    '<div class="mu" style="text-align:center">' +
    'F8 — реализм · Esc — продолжить · сборка 04.11-C</div>' +

    '</div>';
}

function pauseOpen() {
  if (PZ || mode != 'play') return;

  PZ = 1;
  keys = {};

  try {
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
  } catch (e) {}

  pauseDraw();
}

function pauseHide() {
  PZ = 0;

  var o = $('pz');

  if (o) {
    o.style.display = 'none';
  }
}

/* Возвращение в игру и восстановление захвата мыши */
function pauseClose() {
  if (!PZ) return;

  pauseHide();

  try {
    optSave();
  } catch (e) {}

  keys = {};

  // Возвращаем захват мыши сразу после действия пользователя.
  try {
    if (mode == 'play' && typeof tryLock === 'function') {
      tryLock();
      // в приложении просим вернуть захват мыши «как от клика» (без этого после Esc нужен клик)
      try { if (window.pcApp && window.pcApp.relock) window.pcApp.relock(); } catch (e) {}
      // после выхода по Esc браузер около секунды не даёт захватить мышь: пробуем ещё раз
      setTimeout(function () {
        if (mode == 'play' && !PZ && !document.pointerLockElement) {
          tryLock();
          try { if (window.pcApp && window.pcApp.relock) window.pcApp.relock(); } catch (e) {}
        }
      }, 1300);
    }
  } catch (e) {
    console.warn('Pointer Lock error:', e);
  }
}

/* Выход из игры в главное меню */
function pauseToMenu() {
  pauseHide();

  try {
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
  } catch (e) {}

  toMenu();
}

/* Контроль потери и восстановления захвата мыши */
document.addEventListener('pointerlockchange', function () {
  var l = !!document.pointerLockElement;

  // Если мышь потеряла захват во время игры,
  // открываем меню паузы.
  if (!l && pzWas && mode == 'play' && !PZ) {
    pauseOpen();
  }

  pzWas = l;
});

/* Управление паузой клавишей Escape */
addEventListener('keydown', function (e) {
  if (e.code != 'Escape' || e.repeat) return;

  if (PZ) {
    e.preventDefault();
    e.stopPropagation();
    pauseClose();
  } else if (mode == 'play') {
    // открываем паузу и когда мышь захвачена (в приложении Esc её не отпускает), и когда нет
    e.preventDefault();
    pauseOpen();
  }
});

/* вызывается из приложения (preload) «как от клика», чтобы вернуть захват мыши без реального нажатия */
window.__relock = function () {
  try { if (mode == 'play' && !PZ && !document.pointerLockElement) tryLock(); } catch (e) {}
};

/* Режим «крутить камеру с зажатой кнопкой» нужен только на сенсорных экранах и там, где захват мыши невозможен.
   Раньше игра включала его навсегда после нескольких неудачных попыток захвата (их плодит Esc),
   поэтому на компьютере сбрасываем этот флаг: захват мыши пробуется при каждом клике. */
setInterval(function () {
  try {
    if (typeof noPL != 'undefined' && noPL && !matchMedia('(pointer:coarse)').matches) {
      noPL = 0;
      plErr = 0;
    }
  } catch (e) {}
}, 250);
