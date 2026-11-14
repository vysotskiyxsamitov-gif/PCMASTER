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
  (function anim() { requestAnimationFrame(anim); if (ld.style.display === 'none') return; shown += (prog - shown) * .12; if (bar) bar.style.width = shown.toFixed(1) + '%'; if (pc) pc.textContent = Math.round(shown) + '%'; })();
  function safe(f) { try { return f(); } catch (e) { console.warn('[load]', e); } }
  var perfOn = false;
  function finish() {
    if (done) return; done = true; clearInterval(tipIv); perfOn = true;
    set(100, 'Готово');
    if (window.__batch && window.__batch.run) setTimeout(function () { window.__batch.run(); }, 600);
    if (window.__batch && window.__batch.prune) [1500, 10000, 32000].forEach(function (t) { setTimeout(function () { try { window.__batch.prune(); } catch (e) { } }, t); });
    if (window.__batch && window.__batch.again) [9000, 30000].forEach(function (t) { setTimeout(function () { try { window.__batch.again(); } catch (e) { } }, t); });   // добираем объекты, появившиеся после загрузки
    if (bar) bar.style.width = '100%'; if (pc) pc.textContent = '100%';
    setTimeout(function () { if (ld) { ld.style.opacity = '0'; setTimeout(function () { ld.style.display = 'none'; }, 800); } }, 250);
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
    if (!perfOn || !(dt > 0) || dt > .25 || typeof mode == 'undefined' || mode == 'menu') { acc = 0; n = 0; return; }
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
  var warmed = false;
  function warmRender() {   /* один кадр со ВСЕМ включённым: геометрия и шейдеры скрытых объектов (склад, ящики…) уходят в видеокарту заранее */
    var saved = [], extra = [];
    safe(function () { [{ col: 0x3366aa, pa: 0x222222 }, { col: 0x111111, pa: 0x0b0b0b, bad: 1 }].forEach(function (o) { var g = mkP(o); if (g) { g.position.set(0, 1, 0); extra.push(g); } }); });
    scene.traverse(function (o) { if (o.isLight) return; saved.push([o, o.visible, o.frustumCulled]); o.visible = true; o.frustumCulled = false; });
    safe(function () { R.render(scene, cam); });
    saved.forEach(function (s) { s[0].visible = s[1]; s[0].frustumCulled = s[2]; });
    extra.forEach(function (g) { scene.remove(g); });
  }
  function warm(setP, onDone, minMs, maxMs) {
    var mats = [], mi = 0, stage = 1, tm = performance.now(), frames = 0, good = 0, t0w = performance.now(), fin = false, skipB = null, slow = 0;
    function end() { if (fin) return; fin = true; if (skipB && skipB.parentNode) skipB.parentNode.removeChild(skipB); console.log('[load] готово за', Math.round(performance.now() - t0w), 'мс, стадия', stage, ', кадров', frames); onDone(); }
    setTimeout(function () { if (fin || !ld) return; skipB = document.createElement('button'); skipB.textContent = 'Пропустить'; skipB.style.cssText = 'margin-top:18px;padding:9px 18px;border-radius:10px;border:1px solid rgba(255,255,255,.3);background:rgba(255,255,255,.08);color:#e8ecff;font:inherit;cursor:pointer'; skipB.onclick = end; ld.appendChild(skipB); }, 6000);
    (function step() {
      var el = performance.now() - t0w;
      if (el > (maxMs || 15000)) { end(); return; }
      requestAnimationFrame(step);
      if (stage === 1) {
        if (performance.now() - tm < 700) { setP(42, 'Настройка стиля…'); return; }
        safe(function () { R.compile(scene, cam); });
        var seen = new Set();
        scene.traverse(function (o) { var m = o.material; if (!m) return; (Array.isArray(m) ? m : [m]).forEach(function (q) { ['map', 'emissiveMap', 'bumpMap', 'roughnessMap', 'alphaMap'].forEach(function (k) { var t = q[k]; if (t && !seen.has(t)) { seen.add(t); mats.push(t); } }); }); });
        stage = 2; setP(52, 'Шейдеры собраны');
      } else if (stage === 2) {
        var c = 0; while (mi < mats.length && c < 6) { var t = mats[mi++]; safe(function () { if (R.initTexture) R.initTexture(t); }); c++; }
        setP(52 + (mats.length ? mi / mats.length : 1) * 22, 'Загрузка текстур…');
        if (mi >= mats.length) { stage = 3; tm = performance.now(); setP(76, 'Загрузка моделей…'); }
      } else if (stage === 3) {
        if (performance.now() - tm < 120) return;
        warmRender(); stage = 4; tm = performance.now(); frames = 0; good = 0; setP(82, 'Прогрев сцены…');
      } else if (stage === 4) {
        frames++;
        var dt = performance.now() - tm; tm = performance.now();
        if (dt < 38) good++; else good = Math.max(0, good - 1);
        if (dt > 120) slow++;
        setP(82 + Math.min(17, good * 1.7), 'Прогрев сцены…');
        if ((good >= 8 && el > (minMs || 2500)) || frames > 90 || slow > 12) end();
      }
    })();
  }

  /* ---------- 1. запуск: загрузка до главного меню ---------- */
  var FLAGS = ['__W', '__rz', '__look', '__models', '__mood', '__storage', '__style', '__bookview', '__rays'];
  (function boot() {
    var t0b = performance.now();
    (function wait() {
      var have = 0; FLAGS.forEach(function (f) { if (window[f]) have++; });
      set(5 + have / FLAGS.length * 35, have < FLAGS.length ? 'Загрузка модулей…' : 'Модули готовы');
      if (have >= FLAGS.length || performance.now() - t0b > 8000) warm(set, finish, 2500, 15000);
      else setTimeout(wait, 100);
    })();
  })();

  /* ---------- 2. вход в игру: загрузочный экран + прогрев, чтобы дальше не было подвисаний ---------- */
  function showLoad(txt) {
    if (!ld) return; done = false; perfOn = false; prog = 0; shown = 0; tipI = (tipI + 1) % TIPS.length; if (tp) tp.textContent = TIPS[tipI];
    ld.style.display = 'flex'; ld.style.opacity = '1'; set(0, txt || 'Загрузка…'); if (bar) bar.style.width = '0%';
    clearInterval(tipIv); tipIv = setInterval(function () { tipI = (tipI + 1) % TIPS.length; if (tp) tp.textContent = TIPS[tipI]; }, 3200);
  }
  if (typeof startPlay === 'function') {
    var _sp = startPlay, busy = false;
    startPlay = function () {
      if (busy) return _sp.apply(this, arguments);
      busy = true; var args = arguments, self = this;
      showLoad('Подготовка магазина…');
      setTimeout(function () {
        try { _sp.apply(self, args); } catch (e) { console.error(e); }
        set(12, 'Расставляем товар…');
        setTimeout(function () { warm(set, function () { busy = false; finish(); }, 1500, 12000); }, 150);
      }, 120);
    };
  }
})();
