/* PC МАСТЕР — splash.js: заставка студии перед загрузкой.
   Время считается только по реально показанным кадрам: пока движок тяжело грузится и браузер не рисует, заставка не «сгорает».
   Название студии — одна строка ниже. Пропуск: клик, пробел, Enter, Esc (не раньше чем через 1 с). */
(function () {
  var STUDIO = 'Vysam Games';
  var SUB = 'представляет';
  var HOLD = 3600;   // мс реально показанных кадров
  var d = document.createElement('div');
  d.id = 'splash';
  d.style.cssText = 'position:fixed;inset:0;z-index:100000;background:#05060a;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:system-ui,Segoe UI,sans-serif;color:#f2f5fb;opacity:1;transition:opacity .9s ease;cursor:pointer;user-select:none';
  d.innerHTML =
    '<style>@keyframes spIn{from{opacity:0;transform:scale(.94)}to{opacity:1;transform:none}}' +
    '@keyframes spLine{from{transform:scaleX(0)}to{transform:scaleX(1)}}' +
    '@keyframes spSub{from{opacity:0}to{opacity:.75}}</style>' +
    '<div id="spT" style="font-size:clamp(34px,7vw,84px);font-weight:800;letter-spacing:.22em;text-indent:.22em;text-transform:uppercase;text-shadow:0 0 30px rgba(91,140,255,.55);animation:spIn 1.2s ease-out both"></div>' +
    '<div style="width:min(60vw,520px);height:3px;margin:22px 0 18px;background:linear-gradient(90deg,transparent,#5b8cff,transparent);transform-origin:center;animation:spLine 1.3s .3s ease-out both"></div>' +
    '<div id="spS" style="font-size:clamp(13px,2vw,22px);letter-spacing:.35em;text-indent:.35em;text-transform:uppercase;opacity:0;animation:spSub 1s 1s ease-out forwards"></div>';
  d.querySelector('#spT').textContent = STUDIO; d.querySelector('#spS').textContent = SUB;
  (document.body || document.documentElement).appendChild(d);
  var gone = false, shown = 0, last = 0;
  function bye() {
    if (gone) return; gone = true;
    d.style.opacity = '0'; d.style.pointerEvents = 'none';
    setTimeout(function () { if (d.parentNode) d.parentNode.removeChild(d); }, 950);
    window.removeEventListener('keydown', key, true);
  }
  function key(e) { if (shown > 1000 && (e.code === 'Space' || e.code === 'Enter' || e.code === 'Escape')) bye(); }
  d.addEventListener('click', function () { if (shown > 1000) bye(); });
  window.addEventListener('keydown', key, true);
  function frame(t) {
    if (gone) return;
    if (last) shown += Math.min(t - last, 50);
    last = t;
    if (shown >= HOLD) { bye(); return; }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
