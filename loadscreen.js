/* PC МАСТЕР — loadscreen.js: экран загрузки (всё прогревается заранее: модули, шейдеры, текстуры, тени)
   + адаптивное разрешение (держит плавный FPS на ноутбуках). */
(function () {
  if (window.__loadLoaded) return;
  window.__loadLoaded = 1;
  var ld = document.getElementById('ld'), bar = document.getElementById('ldb'), pc = document.getElementById('ldp'), tx = document.getElementById('ldt'), tp = document.getElementById('ldh');
  var t0 = performance.now(), prog = 0, shown = 0, done = false;
  var TIPS = ['Кнопка E — взять, поговорить, использовать.', 'Книга на стойке — подробный справочник по неисправностям и азбуке Морзе.', 'Пыль на корпусе видно — клиент попросит почистить.', 'Не забывай выкидывать мусор в корзину у стены.', 'Консоль админа: клавиша ` или F9.', 'F8 — уровень реализма, в паузе есть все настройки графики.'];
  var tipI = Math.floor(Math.random() * TIPS.length);
  if (tp) tp.textContent = TIPS[tipI];
  var tipIv = setInterval(function () { tipI = (tipI + 1) % TIPS.length; if (tp) tp.textContent = TIPS[tipI]; }, 3200);
  function set(p, t) { prog = Math.max(prog, p); if (t && tx) tx.textContent = t; }
  (function anim() { if (done) return; requestAnimationFrame(anim); shown += (prog - shown) * .12; if (bar) bar.style.width = shown.toFixed(1) + '%'; if (pc) pc.textContent = Math.round(shown) + '%'; })();
  function safe(f) { try { return f(); } catch (e) { console.warn('[load]', e); } }
  function finish() {
    if (done) return; done = true; clearInterval(tipIv);
    set(100, 'Готово');
    if (bar) bar.style.width = '100%'; if (pc) pc.textContent = '100%';
    setTimeout(function () { if (ld) { ld.style.opacity = '0'; setTimeout(function () { if (ld && ld.parentNode) ld.parentNode.removeChild(ld); }, 800); } }, 250);
  }

  /* ---------- адаптивное разрешение ---------- */
  var scale = 1, minS = .6, okMax = 1, lastDown = 0;
  try { var dpr = window.devicePixelRatio || 1; if (dpr > 1.5) scale = 1.5 / dpr; } catch (e) { }
  var baseScale = scale; okMax = scale;
  if (typeof R !== 'undefined' && R && R.setPixelRatio) {
    var _spr = R.setPixelRatio.bind(R);
    R.setPixelRatio = function (v) { return _spr(v * scale); };
    safe(function () { if (typeof rs == 'function') rs(); });
  }
  function apply() { safe(function () { if (typeof rs == 'function') rs(); }); }
  var acc = 0, n = 0, lastT = performance.now(), calm = 0;
  (function perf(now) {
    requestAnimationFrame(perf);
    var dt = (now - lastT) / 1000; lastT = now;
    if (!done || !(dt > 0) || dt > .25 || typeof mode == 'undefined' || mode == 'menu') { acc = 0; n = 0; return; }
    acc += dt; n++;
    if (n < 90) return;
    var fps = n / acc; acc = 0; n = 0;
    if (fps < 46 && scale > minS) { scale = Math.max(minS, scale - .1); okMax = Math.min(okMax, scale + .1); lastDown = now; calm = 0; apply(); }
    else if (fps > 57 && scale < okMax - .01) { if (++calm >= 3) { scale = Math.min(okMax, scale + .1); calm = 0; apply(); } }
    else calm = 0;
    if (now - lastDown > 90000) okMax = baseScale;   // раз в полторы минуты пробуем снова поднять качество
  })(performance.now());
  window.__perf = { get: function () { return scale; } };

  /* ---------- прогрев ---------- */
  var FLAGS = ['__W', '__rz', '__look', '__models', '__mood', '__storage', '__style', '__bookview', '__rays'];
  var mats = [], mi = 0, stage = 0, frames = 0, good = 0, tm = performance.now();
  function step() {
    if (done) return;
    requestAnimationFrame(step);
    var el = performance.now() - t0;
    if (el > 30000) { finish(); return; }
    if (stage === 0) {
      var have = 0; FLAGS.forEach(function (f) { if (window[f]) have++; });
      set(5 + have / FLAGS.length * 35, have < FLAGS.length ? 'Загрузка модулей…' : 'Модули готовы');
      if (have >= FLAGS.length || el > 12000) { stage = 1; tm = performance.now(); }
    } else if (stage === 1) {
      if (performance.now() - tm < 900) { set(42, 'Настройка стиля…'); return; }   // даём отработать очереди стиля и реализма
      safe(function () { R.compile(scene, cam); });
      var seen = new Set();
      scene.traverse(function (o) { var m = o.material; if (!m) return; (Array.isArray(m) ? m : [m]).forEach(function (q) { ['map', 'emissiveMap', 'bumpMap', 'roughnessMap', 'alphaMap'].forEach(function (k) { var t = q[k]; if (t && !seen.has(t)) { seen.add(t); mats.push(t); } }); }); });
      stage = 2; set(55, 'Шейдеры собраны');
    } else if (stage === 2) {
      var cnt = 0;
      while (mi < mats.length && cnt < 6) { var t = mats[mi++]; safe(function () { if (R.initTexture) R.initTexture(t); }); cnt++; }
      set(55 + (mats.length ? mi / mats.length : 1) * 30, 'Загрузка текстур…');
      if (mi >= mats.length) { stage = 3; tm = performance.now(); frames = 0; good = 0; }
    } else if (stage === 3) {
      /* прогрев кадров: ждём несколько подряд плавных кадров, чтобы игрок не видел подгрузки */
      frames++;
      var dt = performance.now() - tm; tm = performance.now();
      if (dt < 40) good++; else good = Math.max(0, good - 1);
      set(85 + Math.min(14, good * 1.4), 'Прогрев сцены…');
      if ((good >= 10 && el > 3500) || frames > 240) finish();
    }
  }
  /* стартуем после того, как ядро игры отрисовало первый кадр */
  setTimeout(function () { requestAnimationFrame(step); }, 200);
})();
