/* PC МАСТЕР — post.js: постобработка (bloom) для мощных ПК.
   Включается автоматически только на «хорошем железе» (не тач, ≥8 потоков, ≥8 ГБ ОЗУ) и отключается,
   если FPS проседает. Ручное отключение: Настройки → «Bloom» (opt.pp = 0).
   Подключать ПОСЛЕ всех остальных модулей: <script src="post.js"></script> */
(function () {
  if (window.__postLoaded) return;
  window.__postLoaded = 1;

  function ready() {
    try { return !!(THREE.EffectComposer && scene && R && cam && typeof opt === 'object' && window.__roomLoaded); } catch (e) { return false; }
  }
  function capable() {
    var coarse = false; try { coarse = matchMedia('(pointer:coarse)').matches; } catch (e) {}
    return !coarse && (navigator.hardwareConcurrency || 4) >= 8 && (navigator.deviceMemory || 8) >= 8;
  }

  function go() {
    var composer = null, bloom = null, busy = false, dead = false, sw = 0, sh = 0, spr = 0;
    var origRender = R.render.bind(R), acc = 0, n = 0, last = performance.now();
    var size = new THREE.Vector2();

    function wanted() { return !dead && opt.pp !== 0 && capable(); }

    function build() {
      R.getSize(size); var pr = R.getPixelRatio();
      var rt = new THREE.WebGLRenderTarget(size.x * pr, size.y * pr, { type: THREE.HalfFloatType, samples: 4 });
      composer = new THREE.EffectComposer(R, rt);
      composer.setPixelRatio(pr); composer.setSize(size.x, size.y);
      composer.addPass(new THREE.RenderPass(scene, cam));
      bloom = new THREE.UnrealBloomPass(new THREE.Vector2(size.x, size.y), .45, .6, .92);
      composer.addPass(bloom);
      composer.addPass(new THREE.OutputPass());   // тон-маппинг (ACES + экспозиция рендера) и перевод в sRGB
      sw = size.x; sh = size.y; spr = pr;
    }

    R.render = function (s, c) {
      if (busy || s !== scene || c !== cam || !wanted()) { acc = 0; n = 0; return origRender(s, c); }
      try {
        if (!composer) build();
        R.getSize(size); var pr = R.getPixelRatio();
        if (size.x !== sw || size.y !== sh || pr !== spr) { composer.setPixelRatio(pr); composer.setSize(size.x, size.y); sw = size.x; sh = size.y; spr = pr; }
        busy = true; composer.render(); busy = false;
      } catch (e) {
        busy = false; dead = true; console.warn('post.js: постобработка отключена', e);
        return origRender(s, c);
      }
      /* защита от просадок: если средний FPS < 40 — выключаем bloom насовсем */
      var now = performance.now(), dt = (now - last) / 1000; last = now;
      if (dt > 0 && dt < .25) { acc += dt; n++; if (n >= 120) { if (n / acc < 40) dead = true; acc = 0; n = 0; } }
    };

    window.__pp = { on: function () { return !!composer && wanted(); } };
  }

  if (ready()) setTimeout(go, 500);
  else {
    var t = 0, iv = setInterval(function () {
      if (ready()) { clearInterval(iv); setTimeout(go, 500); }
      else if (++t > 400) clearInterval(iv);
    }, 50);
  }
})();
