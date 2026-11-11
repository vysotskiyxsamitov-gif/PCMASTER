/* PC МАСТЕР — меню паузы (Esc).
   Исправлен возврат Pointer Lock после паузы.
*/

var PZ = 0;
var pzWas = false;

var pzTab = 'g';
var PZ_BUILD = 'сборка 11.11-S';

function pzCss() {
  if (document.getElementById('pzcss')) return;
  var st = document.createElement('style'); st.id = 'pzcss';
  st.textContent =
    '#pz .pp{width:min(900px,95vw);max-height:90vh;display:flex;border-radius:22px;overflow:hidden;background:rgba(11,14,26,.92);border:1px solid rgba(255,255,255,.14);box-shadow:0 30px 90px rgba(0,0,0,.65);animation:pzin .25s both;font-family:system-ui,"Segoe UI",sans-serif}' +
    '@keyframes pzin{from{opacity:0;transform:scale(.97)}to{opacity:1;transform:none}}' +
    '#pz .sd{width:290px;flex:none;padding:22px 20px;background:linear-gradient(180deg,rgba(110,231,255,.07),rgba(168,85,247,.07));border-right:1px solid rgba(255,255,255,.09);display:flex;flex-direction:column;gap:12px}' +
    '#pz .sd h1{margin:0;font-size:34px;letter-spacing:.1em;background:linear-gradient(90deg,#6ee7ff,#c084fc,#f472b6);-webkit-background-clip:text;background-clip:text;color:transparent}' +
    '#pz .ch{display:grid;grid-template-columns:1fr 1fr;gap:8px}#pz .ch div{padding:8px 10px;border-radius:11px;background:rgba(255,255,255,.06);font-size:12px;color:#98a0b4}#pz .ch b{display:block;color:#f1f5f9;font-size:16px;margin-top:1px}#pz .ch .bd b{color:#f87171}' +
    '#pz .ob{padding:10px 12px;border-radius:12px;background:rgba(251,191,36,.09);border:1px solid rgba(251,191,36,.25);font-size:13px;line-height:1.4;color:#fde9a8}#pz .ob small{display:block;color:#c9a64a;letter-spacing:.15em;font-size:10px;margin-bottom:3px}' +
    '#pz .bt2{padding:12px 14px;border-radius:12px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.07);color:#e8eaf2;font:inherit;font-size:15px;cursor:pointer;text-align:left;transition:background .15s,transform .15s}#pz .bt2:hover{background:rgba(255,255,255,.14);transform:translateX(4px)}' +
    '#pz .bt2.pr3{background:linear-gradient(90deg,#22d3ee,#a855f7);border:0;color:#06080f;font-weight:700}#pz .bt2.pr3:hover{filter:brightness(1.1)}' +
    '#pz .mn2{flex:1;display:flex;flex-direction:column;min-width:0}' +
    '#pz .tb{display:flex;gap:4px;padding:14px 18px 0;border-bottom:1px solid rgba(255,255,255,.08)}#pz .tb button{padding:10px 16px;border:0;border-bottom:2px solid transparent;background:none;color:#98a0b4;font:inherit;font-size:14px;cursor:pointer}#pz .tb button:hover{color:#fff}#pz .tb button.on{color:#6ee7ff;border-color:#6ee7ff}' +
    '#pz .bd2{padding:14px 18px 18px;overflow:auto;display:flex;flex-direction:column;gap:6px}' +
    '#pz .rw{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:11px 13px;border-radius:11px;background:rgba(255,255,255,.04);cursor:pointer;font-size:14.5px;transition:background .15s}#pz .rw:hover{background:rgba(110,231,255,.1)}#pz .rw .v{color:#98a0b4;font-size:13px}' +
    '#pz .sw{width:42px;height:23px;border-radius:99px;background:rgba(255,255,255,.18);position:relative;flex:none}#pz .sw:after{content:"";position:absolute;top:3px;left:3px;width:17px;height:17px;border-radius:50%;background:#fff;transition:transform .2s}#pz .sw.on{background:linear-gradient(90deg,#22d3ee,#a855f7)}#pz .sw.on:after{transform:translateX(19px)}' +
    '#pz kbd{display:inline-block;min-width:24px;padding:1px 7px;margin-right:6px;border-radius:6px;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.2);font:600 12px monospace;text-align:center}' +
    '#pz .hp{font-size:14px;line-height:1.6;color:#cdd2e2}#pz .hp div{padding:5px 0;border-bottom:1px solid rgba(255,255,255,.06)}#pz .ft2{margin-top:4px;color:#6e7488;font-size:12px;text-align:center}' +
    '@media(max-width:760px){#pz .pp{flex-direction:column;overflow:auto}#pz .sd{width:auto;border-right:0;border-bottom:1px solid rgba(255,255,255,.09)}}';
  document.head.appendChild(st);
}
function pzRow(label, val, js, sw) {
  return '<div class="rw" onclick="' + js + '"><span>' + label + '</span>' + (sw ? '<span class="sw ' + (val ? 'on' : '') + '"></span>' : '<span class="v">' + val + '</span>') + '</div>';
}
function pzClock() { try { var h = window.__W && window.__W.hour ? window.__W.hour() : null; if (h == null) return '—'; var hh = Math.floor(h) % 24, mm = Math.floor((h % 1) * 60); return (hh < 10 ? '0' : '') + hh + ':' + (mm < 10 ? '0' : '') + mm; } catch (e) { return '—'; } }

function pauseDraw() {
  try { optSave(); } catch (e) {}
  pzCss();
  var o = $('pz');
  if (!o) {
    o = document.createElement('div'); o.id = 'pz';
    o.style.cssText = 'position:fixed;inset:0;z-index:20;display:flex;align-items:center;justify-content:center;background:rgba(4,5,10,.72);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);pointer-events:auto';
    $('w').appendChild(o);
  }
  o.style.display = 'flex';

  var MS = [.5, .75, 1, 1.5, 2], mi = MS.indexOf(opt.ms || 1), body = '';
  if (pzTab == 'g') {
    body = pzRow('Звуки', opt.s, 'opt.s=!opt.s;pauseDraw()', 1) + pzRow('Озвучка героя', opt.v, 'opt.v=!opt.v;pauseDraw()', 1) +
      pzRow('Громкость', Math.round((window.__vol || 1) * 100) + '%', 'audioVol({25:.5,50:.75,75:1,100:.25}[Math.round((window.__vol||1)*100)]||1);opt.s=1;pauseDraw()') +
      pzRow('🔊 Проверить звук', '', "opt.s=1;sfx('buy');setTimeout(function(){sfx('place')},350);setTimeout(function(){sfx('door')},750)");
  } else if (pzTab == 'v') {
    body = pzRow('Высокое качество', opt.q, 'opt.q=!opt.q;rs();pauseDraw()', 1) +
      pzRow('Реализм (тени, детали)', window.__rz ? window.__rz.name() : 'нет', 'window.__rz&&window.__rz.cycle();pauseDraw()') +
      pzRow('Показывать FPS и нагрузку', !!(window.__batch && window.__batch.hudOn()), 'window.__batch&&window.__batch.hud();pauseDraw()', 1) +
      pzRow('Объединение объектов (бета)', !!(window.__batch && window.__batch.get()), 'window.__batch&&window.__batch.toggle();pauseDraw()', 1) +
      pzRow('Красота (паркет, лучи)', !!(window.__look && window.__look.get()), 'window.__look&&window.__look.toggle();pauseDraw()', 1) +
      pzRow('Аниме-стиль (как MiSide)', !!(window.__style && window.__style.get()), 'window.__style&&window.__style.toggle();pauseDraw()', 1) +
      pzRow('Атмосфера (мрак, зерно)', !!(window.__mood && window.__mood.get()), 'window.__mood&&window.__mood.toggle();pauseDraw()', 1) +
      pzRow('Ультра-отражения', opt.ul !== 0, 'opt.ul=opt.ul===0?1:0;pauseDraw()', 1) +
      pzRow('Свечение неона', opt.bl !== 0, 'opt.bl=opt.bl===0?1:0;pauseDraw()', 1) +
      pzRow('Размытие при повороте', opt.mb !== 0, 'opt.mb=opt.mb===0?1:0;pauseDraw()', 1);
  } else if (pzTab == 'c') {
    body = pzRow('Чувствительность мыши', '× ' + (opt.ms || 1), 'opt.ms=[.5,.75,1,1.5,2][' + ((mi + 1) % 5) + '];pauseDraw()') +
      pzRow('Инверсия оси Y', opt.inv, 'opt.inv=!opt.inv;pauseDraw()', 1) + pzRow('Плавная камера', opt.sm, 'opt.sm=opt.sm?0:1;pauseDraw()', 1) +
      '<div class="hp" style="margin-top:8px"><div><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> ходить</div><div><kbd>E</kbd> взять / использовать · <kbd>Q</kbd> отказать</div><div><kbd>F</kbd> фонарик в темноте · <kbd>F8</kbd> реализм</div><div><kbd>Esc</kbd> пауза / закрыть книгу</div></div>';
  } else {
    body = '<div class="hp"><div>📖 <b>Книга на верстаке</b> — расшифровка писков неисправных ПК. Нажми E на ней и листай.</div><div>💡 Свет погас — ищи ключ от щитка: он блестит в темноте.</div><div>🧰 Ремонт без деталей: чистка от пыли и термопаста.</div><div>🚪 В старых зданиях бывают закрытые комнаты… ключ ищи в ящиках стола.</div><div>💬 Клиент пришёл с просьбой — <kbd>E</kbd> согласиться, <kbd>Q</kbd> отказать.</div></div>';
  }
  var tabs = [['g', 'Звук'], ['v', 'Графика'], ['c', 'Управление'], ['h', 'Подсказки']].map(function (t) { return '<button class="' + (pzTab == t[0] ? 'on' : '') + '" onclick="pzTab=\'' + t[0] + '\';pauseDraw()">' + t[1] + '</button>'; }).join('');

  var day = '—', money = '—', debt = '—', wait = 0, quest = '';
  try { day = G.sb ? 'песочница' : G.day + ' / 30'; money = M(G.m); debt = G.sb ? '—' : M(G.debt); wait = CU.filter(function (c) { return c.s == 'wait'; }).length; quest = qText(); } catch (e) {}

  o.innerHTML =
    '<div class="pp"><div class="sd"><h1>ПАУЗА</h1>' +
    '<div class="ch"><div>День<b>' + day + '</b></div><div>Время<b>' + pzClock() + '</b></div><div>Деньги<b>' + money + '</b></div><div class="bd">Долг<b>' + debt + '</b></div><div>Клиентов ждёт<b>' + wait + '</b></div><div>Готовых ПК<b>' + (function () { try { return G.pcs.length; } catch (e) { return 0; } })() + '</b></div></div>' +
    (quest ? '<div class="ob"><small>ЦЕЛЬ</small>' + quest + '</div>' : '') +
    '<button class="bt2 pr3" onclick="pauseClose()">▶ Продолжить <span style="opacity:.6;font-weight:400">· Esc</span></button>' +
    '<button class="bt2" onclick="pauseToMenu()">💾 Сохранить и выйти в меню</button>' +
    '<div class="ft2">' + PZ_BUILD + '</div></div>' +
    '<div class="mn2"><div class="tb">' + tabs + '</div><div class="bd2">' + body + '</div></div></div>';
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
